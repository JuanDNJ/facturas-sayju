type Props = { id?: string }

export default function DniHelp({ id }: Props) {
  return (
    <div id={id} className="muted mt-1 text-xs">
      Formatos válidos: DNI clásico (8 dígitos + letra, p. ej. 12345678Z) o NIE (empieza por X, Y o
      Z, p. ej. X1234567L).
    </div>
  )
}
