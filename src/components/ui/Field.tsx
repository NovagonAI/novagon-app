import { useId } from 'react'

/** Label above input, hint linked with aria-describedby, all in the Figma sizes. */
export function Field({
  label,
  value,
  onChange,
  hint,
  placeholder,
  list,
  type = 'text',
  required,
  name,
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  placeholder?: string
  list?: string
  type?: string
  required?: boolean
  name?: string
  className?: string
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        list={list}
        className="field"
        value={value}
        placeholder={placeholder}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-[13px] font-medium text-grey-text">
          {hint}
        </p>
      )}
    </div>
  )
}
