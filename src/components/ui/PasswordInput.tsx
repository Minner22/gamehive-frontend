import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react'
import { Icon } from './Icon'
import { Input } from './Input'

type PasswordInputProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'type' | 'trailing'>

/** Pole hasła z przyciskiem podglądu (pokaż/ukryj). */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false)
    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ukryj hasło' : 'Pokaż hasło'}
            className="rounded-full p-1.5 text-secondary transition-colors hover:text-primary"
          >
            <Icon name={visible ? 'visibility_off' : 'visibility'} className="text-xl" />
          </button>
        }
        {...props}
      />
    )
  },
)
