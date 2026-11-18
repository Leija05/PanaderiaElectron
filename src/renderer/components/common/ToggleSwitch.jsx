import React from 'react';

export const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  label,
  id
}) => {
  return (
    <label className={`toggle-switch-label ${disabled ? 'disabled' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
        className="toggle-switch-input"
      />
      <span className="toggle-switch-slider"></span>
      {label && <span className="toggle-switch-text">{label}</span>}
    </label>
  );
};
