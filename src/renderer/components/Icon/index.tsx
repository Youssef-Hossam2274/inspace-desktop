import styles from "./styles.module.scss";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  className?: string;
}

export function Logo({
  size = "md",
  variant = "full",
  className = "",
}: LogoProps) {
  // Map size prop to CSS module classes
  const sizeClasses = {
    sm: {
      container: styles.containerSm,
      icon: styles.iconSm,
      text: styles.textSm,
    },
    md: {
      container: styles.containerMd,
      icon: styles.iconMd,
      text: styles.textMd,
    },
    lg: {
      container: styles.containerLg,
      icon: styles.iconLg,
      text: styles.textLg,
    },
    xl: {
      container: styles.containerXl,
      icon: styles.iconXl,
      text: styles.textXl,
    },
  };

  const sizes = sizeClasses[size];

  const LogoIcon = () => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={sizes.icon}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop
            offset="0%"
            style={{ stopColor: "var(--primary-color)", stopOpacity: 1 }}
          />
          <stop
            offset="50%"
            style={{ stopColor: "var(--primary-color-light)", stopOpacity: 1 }}
          />
          <stop
            offset="100%"
            style={{ stopColor: "var(--primary-color-dark)", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>

      {/* Outer orbital ring */}
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        fill="none"
        opacity="0.4"
      />

      {/* Inner cube/box representing testing */}
      <path
        d="M50 20 L70 32 L70 52 L50 64 L30 52 L30 32 Z"
        stroke="url(#logoGradient)"
        strokeWidth="2.5"
        fill="none"
      />

      {/* Connecting lines to represent automation/network */}
      <line
        x1="50"
        y1="20"
        x2="50"
        y2="36"
        stroke="url(#logoGradient)"
        strokeWidth="2"
      />
      <line
        x1="30"
        y1="32"
        x2="38"
        y2="38"
        stroke="url(#logoGradient)"
        strokeWidth="2"
      />
      <line
        x1="70"
        y1="32"
        x2="62"
        y2="38"
        stroke="url(#logoGradient)"
        strokeWidth="2"
      />

      {/* Central AI core */}
      <circle cx="50" cy="42" r="8" fill="url(#logoGradient)" />

      {/* Small orbital dots */}
      <circle cx="50" cy="10" r="3" fill="url(#logoGradient)" opacity="0.8" />
      <circle cx="85" cy="35" r="2.5" fill="url(#logoGradient)" opacity="0.6" />
      <circle cx="15" cy="65" r="2.5" fill="url(#logoGradient)" opacity="0.6" />
    </svg>
  );

  const LogoText = () => (
    <div className={styles.logoText}>
      <span className={`${sizes.text} ${styles.logoTextPrimary}`}>Inspace</span>
      <span className={`${sizes.text} ${styles.logoTextSecondary}`}>AI</span>
    </div>
  );

  if (variant === "icon") {
    return (
      <div className={className}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={className}>
        <LogoText />
      </div>
    );
  }

  return (
    <div className={`${styles.logoContainer} ${sizes.container} ${className}`}>
      <LogoIcon />
      <LogoText />
    </div>
  );
}
