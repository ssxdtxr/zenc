type Props = { message: string }

export const ErrorMessage = ({ message }: Props) => (
  <div
    className="px-4 py-3 rounded-2xl text-sm"
    style={{ background: "#fef2f2", border: "1.5px solid rgba(220,38,38,0.2)", color: "#dc2626" }}
  >
    {message}
  </div>
)
