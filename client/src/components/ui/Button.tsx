interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent";
}

export const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) => {
  const base =
    "rounded-xl px-6 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300 shadow-md shadow-blue-200 dark:shadow-none",
    secondary:
      "border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-300 transition-colors duration-300",
    accent:
      "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 focus:ring-blue-300 shadow-md shadow-blue-200 dark:shadow-none transition-colors duration-300",
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
