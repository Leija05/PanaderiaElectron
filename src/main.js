//cargar de pagina en app
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./includes/conexion.js'); // Importa el módulo de conexión a la base de datos
if (process.env.NODE_ENV === 'prdoduction') {
  require('electron-reload')(__dirname, {

  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('views/index.html');
}
app.whenReady().then(createWindow);

// ========================
// LOGICA PARA OBTENER VENTAS Y DETALLES
// ========================
ipcMain.handle('getVentas', async () => {
   return new Promise((resolve, reject) => {
    db.query("SELECT * FROM Ventas", (error, results) => {
      if (error) {
        console.error("Error al obtener las Ventas:", error);
        reject(new Error("Error al obtener las Ventas: " + error.message));
      } else {
        resolve(results);
      }
    });
  });
});

ipcMain.handle('getDetallesVenta', async (event, idVenta) => {
  return new Promise((resolve, reject) => {
    // 1️⃣ Obtener la venta principal
    db.query("SELECT * FROM Ventas WHERE IdVenta = ?", [idVenta], (error, ventas) => {
      if (error || ventas.length === 0) {
        console.error("❌ Error al obtener la venta:", error);
        return reject(new Error("No se encontró la venta"));
      }

      const venta = ventas[0];

      // 2️⃣ Obtener información del empleado
      db.query("SELECT IdEmpleado, NombreCompleto, Turno FROM Empleados WHERE IdEmpleado = ?", [venta.IdEmpleado], (errorEmp, empleados) => {
        if (errorEmp) {
          console.error("❌ Error al obtener el empleado:", errorEmp);
          return reject(new Error("Error al obtener el empleado"));
        }

        const empleado = empleados[0] || { NombreCompleto: "Desconocido" };

        // 3️⃣ Obtener productos vendidos (JOIN con Articulos)
        const queryDetalles = `
          SELECT 
            vd.IdArticulo, 
            a.Nombre AS NombreProducto,
            vd.Cantidad, 
            vd.PrecioUnitario, 
            vd.Subtotal
          FROM VentaDetalle vd
          JOIN Articulos a ON vd.IdArticulo = a.IdArticulo
          WHERE vd.IdVenta = ?;
        `;

        db.query(queryDetalles, [idVenta], (errorDet, detalles) => {
          if (errorDet) {
            console.error("❌ Error al obtener los detalles de la venta:", errorDet);
            return reject(new Error("Error al obtener los detalles de la venta"));
          }

          // 4️⃣ Armar respuesta final
          resolve({
            Empleado: empleado,
            Productos: detalles
          });
        });
      });
    });
  });
});


// ========================
// LOGICA PARA CONSULTAR ARTICULOS
// ========================
ipcMain.handle('getArticulos', async () => {
  const [rows] = await db.query('SELECT * FROM articulos');
  return rows;
});

// ========================
// LOGICA PARA HACER LOGIN 
// ========================
ipcMain.handle('login', async (event, username, password) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM empleados WHERE NombreUsuario = ? AND Password = ?',
      [username, password],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          if (results.length > 0) {
            const usuario = results[0];
            if (usuario.Activo === 0 || usuario.Activo === false) {
              resolve({ 
                success: false, 
                error: 'Usuario desactivado',
                message: 'Este usuario ha sido desactivado y no puede acceder al sistema.'
              });
            } else {
              resolve({ 
                success: true, 
                user: usuario 
              });
            }
          } else {
            resolve({ 
              success: false, 
              error: 'Credenciales incorrectas',
              message: 'Usuario o contraseña incorrectos'
            });
          }
        }
      }
    );
  });
});

// ========================
// LOGICA PARA REGISTRAR USUARIO
// ========================
ipcMain.handle('registrarUsuario', async (event, data) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO empleados (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto, FechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.username, data.password, data.rol, data.puesto, data.turno, data.salario, data.name, new Date() || ''],
      (err, results) => {
        if (err) {
          console.error('Error al registrar usuario:', err);
          reject(err);
        } else {
          resolve({ id: results.insertId });
        }
      }
    );
  });
});

// ========================
// LOGICA PARA REGISTRAR PROVEEDOR
// ========================
ipcMain.handle('registrarProveedor', async (event, data) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO Proveedores (Nombre, Direccion, Telefono, Correo, Contacto, RUC) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.direccion, data.telefono, data.mail, data.contacto, null],
      (err, results) => {
        if (err) {
          console.error('Error al registrar proveedor:', err);
          reject(err);
        } else {
          resolve({ id: results.insertId });
        }
      }
    );
  });
});

// ========================
// LOGICA PARA MODIFICAR USUARIO
// ========================
ipcMain.handle('modificarUsuario', async (event, data) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE empleados 
      SET NombreUsuario = ?, Rol = ?, Puesto = ?, Turno = ?, Salario = ?, NombreCompleto = ?
      WHERE IdEmpleado = ?`;

    db.query(
      sql,
      [data.username,data.rol,data.puesto,data.turno,data.salario,data.name,data.id],
      (err, results) => {
        if (err) {
          console.error('Error al modificar usuario:', err);
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
});
// ========================
// LOGICA PARA ELIMINAR USUARIO
// ========================
ipcMain.handle('deleteUsuario', async (event, idEmpleado) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT IdEmpleado, Rol FROM Empleados WHERE IdEmpleado = ?', [idEmpleado], (err, rows) => {
      if (err) return reject(err);
      if (!rows || rows.length === 0) return reject(new Error('Empleado no encontrado'));

      const empleado = rows[0];
      if (empleado.Rol === 'Gerente') {
        db.query('SELECT COUNT(*) as totalGerentes FROM Empleados WHERE Rol = "Gerente"', (err2, countRows) => {
          if (err2) return reject(err2);

          if (countRows[0].totalGerentes <= 1) {
            return reject(new Error('No se puede eliminar el único gerente del sistema'));
          }
          eliminarEmpleado(idEmpleado, resolve, reject);
        });
      } else {
        eliminarEmpleado(idEmpleado, resolve, reject);
      }
    });
  });
});

function eliminarEmpleado(idEmpleado, resolve, reject) {
  db.beginTransaction((err) => {
    if (err) return reject(err);
    db.query('SELECT COUNT(*) as count FROM Ventas WHERE IdEmpleado = ?', [idEmpleado, idEmpleado], (err1, ventaRows) => {
      if (err1) return db.rollback(() => reject(err1));
      db.query('SELECT COUNT(*) as count FROM Compras WHERE IdEmpleado = ?', [idEmpleado], (err2, compraRows) => {
        if (err2) return db.rollback(() => reject(err2));
        db.query('SELECT COUNT(*) as count FROM Envios WHERE IdEmpleadoRepartidor = ?', [idEmpleado, idEmpleado], (err3, envioRows) => {
          if (err3) return db.rollback(() => reject(err3));
          db.query('SELECT COUNT(*) as count FROM MovimientosInventario WHERE IdEmpleado = ?', [idEmpleado], (err4, movimientoRows) => {
            if (err4) return db.rollback(() => reject(err4));
            const tieneRelaciones =
              ventaRows[0].count > 0 ||
              compraRows[0].count > 0 ||
              envioRows[0].count > 0 ||
              movimientoRows[0].count > 0;
            if (tieneRelaciones) {
              db.query('UPDATE Empleados SET Activo = FALSE WHERE IdEmpleado = ?', [idEmpleado], (err5) => {
                if (err5) return db.rollback(() => reject(err5));

                db.commit((err6) => {
                  if (err6) return db.rollback(() => reject(err6));
                  resolve({
                    ok: true,
                    idEmpleado,
                    message: 'Usuario desactivado (tenía registros relacionados)',
                    tipo: 'desactivacion'
                  });
                });
              });
            } else {
              db.query('DELETE FROM Empleados WHERE IdEmpleado = ?', [idEmpleado], (err5) => {
                if (err5) return db.rollback(() => reject(err5));

                db.commit((err6) => {
                  if (err6) return db.rollback(() => reject(err6));
                  resolve({
                    ok: true,
                    idEmpleado,
                    message: 'Usuario eliminado permanentemente',
                    tipo: 'eliminacion'
                  });
                });
              });
            }
          });
        });
      });
    });
  });
}

// ========================
// LOGICA PARA OBTENER EMPLEADOS
// ========================
ipcMain.handle('getEmpleados', async () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM Empleados ORDER BY Activo DESC, IdEmpleado ASC", (error, results) => {
      if (error) {
        console.error("Error al obtener empleados:", error);
        reject(new Error("Error al obtener empleados: " + error.message));
      } else {
        resolve(results);
      }
    });
  });
});

// ========================
// LOGICA PARA OBTENER PROVEEDORES
// ========================
ipcMain.handle('getProveedores', async () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM Proveedores ORDER BY IdProveedor ASC", (error, results) => {
      if (error) {
        console.error("Error al obtener proveedores:", error);
        reject(new Error("Error al obtener proveedores: " + error.message));
      } else {
        resolve(results);
      }
    });
  });
});

// ===================
// LOGICA PARA CAMBIAR ESTADO DEL USUARIO (ACTIVAR/DESACTIVAR)
// ===================
ipcMain.handle("cambiarEstadoUsuario", async (event, idEmpleado, nuevoEstado) => {
  return new Promise((resolve, reject) => {
    console.log("Cambiando estado del empleado:", { idEmpleado, nuevoEstado });

    const idNum = Number(idEmpleado);
    const estado = Boolean(nuevoEstado);
    
    if (isNaN(idNum) || idNum <= 0) {
      return reject(new Error("ID de empleado inválido."));
    }

    // Verificar que el empleado existe
    db.query(
      "SELECT IdEmpleado, NombreCompleto, Rol FROM Empleados WHERE IdEmpleado = ?",
      [idNum],
      (selectError, selectResults) => {
        if (selectError) {
          return reject(new Error("Error al verificar empleado: " + selectError.message));
        }

        if (selectResults.length === 0) {
          return reject(new Error("Empleado no encontrado."));
        }

        const empleado = selectResults[0];

        // Validación especial para administradores
        if (empleado.Rol === 'Gerente' && !estado) {
          // Verificar que no sea el último administrador activo
          db.query(
            "SELECT COUNT(*) as total FROM Empleados WHERE Rol = 'Gerente' AND Activo = 1",
            (countError, countResults) => {
              if (countError) {
                return reject(new Error("Error al verificar administradores: " + countError.message));
              }

              const totalAdmins = countResults[0].total;
              if (totalAdmins <= 1) {
                return reject(new Error("No se puede desactivar el único administrador del sistema."));
              }

              actualizarEstadoEmpleado(idNum, estado, empleado.NombreCompleto, resolve, reject);
            }
          );
        } else {
          actualizarEstadoEmpleado(idNum, estado, empleado.NombreCompleto, resolve, reject);
        }
      }
    );
  });
});

function actualizarEstadoEmpleado(idEmpleado, nuevoEstado, nombreEmpleado, resolve, reject) {
  const query = "UPDATE Empleados SET Activo = ? WHERE IdEmpleado = ?";
  
  db.query(query, [nuevoEstado, idEmpleado], (updateError, updateResults) => {
    if (updateError) {
      reject(new Error("Error al actualizar empleado: " + updateError.message));
    } else if (updateResults.affectedRows === 0) {
      reject(new Error("No se pudo actualizar el empleado."));
    } else {
      const accion = nuevoEstado ? "reactivado" : "desactivado";
      console.log(`✅ Empleado ${nombreEmpleado} ${accion} correctamente`);
      resolve({
        success: true,
        message: `Empleado ${nombreEmpleado} ${accion} correctamente.`,
        idEmpleado: idEmpleado,
        nuevoEstado: nuevoEstado
      });
    }
  });
}

// ========================
// Logica para OBTENER PRODUCTOS
// ========================
ipcMain.handle('getProductos', async () => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM Articulos',
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  });
});

// ===================
// LOGICA PARA VERIFICAR EXISTENCIA
// ===================
ipcMain.handle("verificarExistencia", async (event, idArticulo, cantidadRequerida) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?",
      [idArticulo],
      (error, results) => {
        if (error) {
          reject(new Error("Error al verificar existencia: " + error.message));
        } else if (results.length === 0) {
          reject(new Error("Producto no encontrado"));
        } else {
          const producto = results[0];
          const disponible = producto.Cantidad;
          
          resolve({
            disponible: disponible,
            puedeVender: disponible >= cantidadRequerida,
            producto: producto.Nombre,
            mensaje: disponible >= cantidadRequerida 
              ? "Disponible" 
              : `Solo hay ${disponible} unidades disponibles`
          });
        }
      }
    );
  });
});

// ===================
// LOGICA PARA REGISTRAR VENTA
// ===================
ipcMain.handle("registrarVenta", async (event, ventaData) => {
  return new Promise((resolve, reject) => {
    console.log("Registrando venta:", ventaData);

    const { idEmpleado, carrito } = ventaData;

    if (!idEmpleado) {
      return reject(new Error("ID de empleado es requerido."));
    }

    if (!carrito || carrito.length === 0) {
      return reject(new Error("El carrito está vacío."));
    }

    db.beginTransaction((err) => {
      if (err) {
        return reject(new Error("Error al iniciar transacción: " + err.message));
      }

      // 1. Verificar existencias primero
      let verificacionesCompletadas = 0;
      let errores = [];

      carrito.forEach((item) => {
        db.query(
          "SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?",
          [item.id],
          (error, results) => {
            if (error) {
              errores.push(`Error al verificar producto ${item.nombre}: ${error.message}`);
            } else if (results.length === 0) {
              errores.push(`Producto ${item.nombre} no encontrado.`);
            } else {
              const producto = results[0];
              if (producto.Cantidad < item.cantidad) {
                errores.push(
                  `No hay suficiente existencia de ${producto.Nombre}. Disponible: ${producto.Cantidad}, Solicitado: ${item.cantidad}`
                );
              }
            }

            verificacionesCompletadas++;
            
            // Cuando todas las verificaciones estén completas
            if (verificacionesCompletadas === carrito.length) {
              if (errores.length > 0) {
                db.rollback(() => {
                  reject(new Error(errores.join("\n")));
                });
                return;
              }

              // 2. Calcular totales
              let subtotal = 0;
              carrito.forEach(item => {
                subtotal += item.precio * item.cantidad;
              });
              const iva = subtotal * 0.16; // 16% de IVA
              const total = subtotal + iva;

              // 3. Insertar venta principal
              const insertVentaQuery = `
                INSERT INTO Ventas (IdEmpleado, IdCliente, Subtotal, Iva, Total, TipoVenta, Estado) 
                VALUES (?, NULL, ?, ?, ?, 'Mostrador', 'Completada')
              `;

              db.query(
                insertVentaQuery,
                [idEmpleado, subtotal, iva, total],
                (error, ventaResults) => {
                  if (error) {
                    db.rollback(() => {
                      reject(new Error("Error al registrar venta: " + error.message));
                    });
                    return;
                  }

                  const idVenta = ventaResults.insertId;
                  let detallesInsertados = 0;

                  // 4. Insertar detalles de venta y actualizar inventario
                  carrito.forEach((item) => {
                    const subtotalItem = item.precio * item.cantidad;
                    
                    // Insertar detalle de venta
                    const insertDetalleQuery = `
                      INSERT INTO VentaDetalle (IdVenta, IdArticulo, Cantidad, PrecioUnitario, Subtotal) 
                      VALUES (?, ?, ?, ?, ?)
                    `;

                    db.query(
                      insertDetalleQuery,
                      [idVenta, item.id, item.cantidad, item.precio, subtotalItem],
                      (error) => {
                        if (error) {
                          db.rollback(() => {
                            reject(new Error("Error al registrar detalle de venta: " + error.message));
                          });
                          return;
                        }

                        // Actualizar inventario
                        const updateInventarioQuery = `
                          UPDATE Articulos SET Cantidad = Cantidad - ? WHERE IdArticulo = ?
                        `;

                        db.query(
                          updateInventarioQuery,
                          [item.cantidad, item.id],
                          (error) => {
                            if (error) {
                              db.rollback(() => {
                                reject(new Error("Error al actualizar inventario: " + error.message));
                              });
                              return;
                            }

                            // Registrar movimiento de inventario
                            const insertMovimientoQuery = `
                              INSERT INTO MovimientosInventario 
                              (IdArticulo, TipoMovimiento, Cantidad, CantidadAnterior, CantidadNueva, 
                               Motivo, IdReferencia, TipoReferencia, IdEmpleado) 
                              VALUES (?, 'Salida', ?, 
                                      (SELECT Cantidad + ? FROM Articulos WHERE IdArticulo = ?), 
                                      (SELECT Cantidad FROM Articulos WHERE IdArticulo = ?), 
                                      'Venta', ?, 'Venta', ?)
                            `;

                            db.query(
                              insertMovimientoQuery,
                              [item.id, item.cantidad, item.cantidad, item.id, item.id, idVenta, idEmpleado],
                              (error) => {
                                if (error) {
                                  console.error("Error al registrar movimiento (no crítico):", error);
                                  // No hacemos rollback por este error, solo log
                                }

                                detallesInsertados++;
                                
                                // Cuando todos los detalles estén procesados
                                if (detallesInsertados === carrito.length) {
                                  db.commit((error) => {
                                    if (error) {
                                      db.rollback(() => {
                                        reject(new Error("Error al confirmar venta: " + error.message));
                                      });
                                    } else {
                                      resolve({
                                        success: true,
                                        idVenta: idVenta,
                                        total: total,
                                        message: "Venta registrada exitosamente"
                                      });
                                    }
                                  });
                                }
                              }
                            );
                          }
                        );
                      }
                    );
                  });
                }
              );
            }
          }
        );
      });
    });
  });
});

// ===================
// LOGICA AGREGAR CANTIDAD A PRODUCTO EXISTENTE
// ===================
ipcMain.handle("agregarCantidadProducto", async (event, idArticulo, cantidad) => {
  return new Promise((resolve, reject) => {
    console.log("Agregando cantidad al producto:", { idArticulo, cantidad });

    // Validación
    const idNum = Number(idArticulo);
    const cantidadNum = Number(cantidad);

    if (!idArticulo || isNaN(idNum) || idNum <= 0) {
      return reject(new Error("ID de artículo inválido."));
    }

    if (!cantidad || isNaN(cantidadNum) || cantidadNum <= 0) {
      return reject(new Error("Cantidad inválida. Debe ser un número mayor a 0."));
    }

    // Primero obtener la cantidad actual
    db.query(
      "SELECT Cantidad, Nombre FROM Articulos WHERE IdArticulo = ?", 
      [idNum], 
      (selectErr, selectResults) => {
        if (selectErr) {
          console.error("Error en SELECT:", selectErr);
          return reject(new Error("Error al consultar el producto: " + selectErr.message));
        }

        if (selectResults.length === 0) {
          return reject(new Error("Artículo no encontrado."));
        }

        const producto = selectResults[0];
        const cantidadActual = Number(producto.Cantidad);
        const nuevaCantidad = cantidadActual + cantidadNum;

        // Actualizar la cantidad
        db.query(
          "UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?",
          [nuevaCantidad, idNum],
          (updateErr, updateResults) => {
            if (updateErr) {
              console.error("Error en UPDATE:", updateErr);
              return reject(new Error("Error al actualizar el producto: " + updateErr.message));
            }

            console.log(`✅ Cantidad actualizada: ${cantidadActual} → ${nuevaCantidad}`);

            resolve({
              success: true,
              message: `Se agregaron ${cantidadNum} unidades al producto "${producto.Nombre}".`,
              cantidadAnterior: cantidadActual,
              cantidadNueva: nuevaCantidad,
              producto: producto.Nombre
            });
          }
        );
      }
    );
  });
});

// ===================
// LOGICA PARA AGREGAR PRODUCTO
// ===================
ipcMain.handle("agregarProducto", async (event, productoData) => {
  return new Promise((resolve, reject) => {
    console.log("Backend recibió datos de producto:", productoData);

    // Validación de datos requeridos
    const { nombre, descripcion ,cantidad, minimo ,precioVenta, precioCompra } = productoData;

    if (!nombre || nombre.trim() === '') {
      return reject(new Error("El nombre del producto es requerido."));
    }

    if (!descripcion || descripcion.trim() === '') {
      return reject(new Error("La descripción del producto es requerida."));
    }

    if (!cantidad || isNaN(cantidad) || cantidad < 0) {
      return reject(new Error("La cantidad debe ser un número válido mayor o igual a 0."));
    }

    if (!minimo || isNaN(minimo) || minimo < 0) {
      return reject(new Error("El mínimo debe ser un número válido mayor o igual a 0."));
    }

    if (!precioVenta || isNaN(precioVenta) || precioVenta < 0) {
      return reject(new Error("El precio de venta debe ser un número válido mayor o igual a 0."));
    }

    if (!precioCompra || isNaN(precioCompra) || precioCompra < 0) {
      return reject(new Error("El precio de compra debe ser un número válido mayor o igual a 0."));
    }

    // Insertar el producto en la base de datos
    const query = `
      INSERT INTO Articulos (Nombre, Descripcion ,Cantidad, Minimo, PrecioVenta, PrecioCompra) 
      VALUES (?, ? ,?, ?, ?, ?)
    `;
    
    const values = [
      nombre.trim(),
      descripcion.trim(),
      Number(cantidad),
      Number(minimo),
      Number(precioVenta),
      Number(precioCompra)
    ];

    // Ejecutar la consulta con mysql
    db.query(query, values, (error, results) => {
      if (error) {
        console.error("Error al agregar producto:", error);
        return reject(new Error("Error al agregar producto: " + error.message));
      }

      console.log("✅ Producto agregado correctamente. ID:", results.insertId);

      resolve({
        success: true,
        message: "Producto agregado correctamente.",
        id: results.insertId
      });
    });
  });
});

// ===================
// LOGICA PARA ELIMINAR PRODUCTO
// ===================
ipcMain.handle("eliminarProducto", async (event, idArticulo, cantidad) => {
  return new Promise((resolve, reject) => {
    console.log("Backend recibió:", idArticulo, cantidad);

    // Validación y conversión a números
    const idNum = Number(idArticulo);
    const cantidadNum = Number(cantidad);

    if (!idArticulo || isNaN(idNum) || idNum <= 0) {
      return reject(new Error("ID de artículo inválido."));
    }

    if (!cantidad || isNaN(cantidadNum) || cantidadNum <= 0) {
      return reject(new Error("Cantidad inválida. Debe ser un número mayor a 0."));
    }
    // Consultar el artículo para obtener la cantidad actual y el mínimo
    db.query(
      "SELECT Cantidad, Minimo, Nombre FROM Articulos WHERE IdArticulo = ?", 
      [idNum], 
      (selectErr, selectResults) => {
        if (selectErr) {
          console.error("Error en SELECT:", selectErr);
          return reject(new Error("Error al consultar artículo: " + selectErr.message));
        }

        if (selectResults.length === 0) {
          return reject(new Error("Artículo no encontrado."));
        }

        const producto = selectResults[0];
        const cantidadActual = Number(producto.Cantidad);
        const minimo = Number(producto.Minimo);
        const nuevaCantidad = cantidadActual - cantidadNum;

        if (nuevaCantidad < 0) {
          return reject(new Error("No hay suficiente inventario para eliminar esa cantidad."));
        }

        db.query(
          "UPDATE Articulos SET Cantidad = ? WHERE IdArticulo = ?",
          [nuevaCantidad, idNum],
          (updateErr, updateResults) => {
            if (updateErr) {
              console.error("Error en UPDATE:", updateErr);
              return reject(new Error("Error al actualizar el inventario: " + updateErr.message));
            }

            console.log(`✅ Cantidad actualizada: ${cantidadActual} → ${nuevaCantidad}`);
            console.log(`✅ Filas afectadas: ${updateResults.affectedRows}`);

            const necesitaReorder = nuevaCantidad < minimo;
            resolve({ 
              message: "Inventario actualizado correctamente.",
              filasAfectadas: updateResults.affectedRows,
              necesitaReorder: necesitaReorder,
              producto: {
                id: idNum,
                nombre: producto.Nombre,
                cantidadAnterior: cantidadActual,
                cantidadNueva: nuevaCantidad,
                minimo: minimo
              }
            });
          }
        );
      }
    );
  });
});

// ========================
// MANEJO DE CIERRE DE LA APLICACIÓN
// ========================
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Cerrar la conexión a la base de datos al salir
    if (db && db.end) {
      db.end();
    }
    app.quit();
  }
});