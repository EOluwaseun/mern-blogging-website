import { useState } from 'react';

const InputBoxComponent = ({
  id,
  name,
  type,
  placeholder,
  value,
  icon,
  disabled = false,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <div className="relative w-[100%] mb-4">
      <input
        name={name}
        type={
          type === 'password' ? (passwordVisible ? 'text' : 'password') : type
        }
        placeholder={placeholder}
        defaultValue={value}
        id={id}
        className="input-box"
        disabled={disabled}
      />
      <i className={`fi ${icon} input-icon`}></i>
      {type === 'password' ? (
        <div onClick={() => setPasswordVisible((currentVal) => !currentVal)}>
          <i
            className={`fi ${
              passwordVisible ? 'fi-rr-eye' : 'fi-rr-eye-crossed'
            }  input-icon left-auto right-4 cursor-pointer`}
          ></i>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
export default InputBoxComponent;
