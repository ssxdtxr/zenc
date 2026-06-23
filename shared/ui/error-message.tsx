type Props = { message: string }

export const ErrorMessage = ({ message }: Props) => (
  <div
    className="px-4 py-3 rounded-2xl text-sm"
    style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.35)", color: "#fca5a5" }}
  >
    {message}
  </div>
)
