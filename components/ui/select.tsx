"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  children: React.ReactNode;
  label?: string;
  placeholder?: string;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  onChange?: (e: { target: { value: string } }) => void;
  value?: string;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "flat" | "bordered" | "faded" | "underlined";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  isInvalid?: boolean;
  errorMessage?: string;
  description?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  classNames?: {
    trigger?: string;
    value?: string;
    popover?: string;
    listbox?: string;
    listboxWrapper?: string;
  };
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
  description?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

const SelectContext = React.createContext<{
  selectedKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  selectedKeys: [],
  onSelectionChange: () => {},
  isOpen: false,
  setIsOpen: () => {},
});

export function Select({
  children,
  label,
  placeholder = "Select an option",
  selectedKeys = [],
  onSelectionChange,
  onChange,
  className,
  disabled = false,
  size = "md",
  variant = "bordered",
  color = "default",
  isInvalid = false,
  errorMessage,
  description,
  startContent,
  endContent,
  classNames = {},
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<string[]>(selectedKeys || []);
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Update internal state when selectedKeys prop changes
  React.useEffect(() => {
    setInternalSelectedKeys(selectedKeys || []);
  }, [selectedKeys]);

  const handleSelectionChange = (keys: string[]) => {
    setInternalSelectedKeys(keys);
    onSelectionChange?.(keys);
    
    // For backward compatibility with onChange
    if (onChange && keys.length > 0) {
      onChange({ target: { value: keys[0] } });
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  const variantClasses = {
    flat: "bg-gray-100 dark:bg-gray-800 border-0",
    bordered: "border border-gray-300 dark:border-gray-600 bg-transparent",
    faded: "border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",
    underlined: "border-0 border-b-2 border-gray-300 dark:border-gray-600 bg-transparent rounded-none",
  };

  const colorClasses = {
    default: "text-gray-900 dark:text-white",
    primary: "text-blue-600 dark:text-blue-400",
    secondary: "text-purple-600 dark:text-purple-400",
    success: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    danger: "text-red-600 dark:text-red-400",
  };

  const selectedValue = React.useMemo(() => {
    if (internalSelectedKeys.length === 0) return placeholder;
    
    // Find the selected item's text
    const selectedKey = internalSelectedKeys[0];
    const childrenArray = React.Children.toArray(children);
    
    for (const child of childrenArray) {
      if (React.isValidElement(child) && (child.props as any).value === selectedKey) {
        return (child.props as any).children;
      }
    }
    
    return placeholder;
  }, [internalSelectedKeys, children, placeholder]);

  return (
    <SelectContext.Provider
      value={{
        selectedKeys: internalSelectedKeys,
        onSelectionChange: handleSelectionChange,
        isOpen,
        setIsOpen,
      }}
    >
      <div className={cn("relative", className)} ref={selectRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            sizeClasses[size],
            variantClasses[variant],
            colorClasses[color],
            isInvalid && "border-red-500 dark:border-red-400",
            classNames.trigger
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {startContent}
            <span className={cn("truncate", classNames.value)}>
              {selectedValue}
            </span>
          </div>
          {endContent || (
            <ChevronDown
              size={16}
              className={cn(
                "text-gray-400 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          )}
        </button>

        {description && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}

        {errorMessage && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            {errorMessage}
          </p>
        )}

        {isOpen && (
          <div
            className={cn(
              "absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg",
              "max-h-60 overflow-y-auto",
              classNames.popover
            )}
          >
            <div className={cn("py-1", classNames.listboxWrapper)}>
              <div className={cn("", classNames.listbox)}>
                {children}
              </div>
            </div>
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectItem({
  children,
  value,
  className,
  disabled = false,
  description,
  startContent,
  endContent,
}: SelectItemProps) {
  const { selectedKeys, onSelectionChange, setIsOpen } = React.useContext(SelectContext);
  const isSelected = selectedKeys.includes(value);

  const handleClick = () => {
    if (disabled) return;
    
    let newKeys: string[];
    if (isSelected) {
      newKeys = selectedKeys.filter(key => key !== value);
    } else {
      newKeys = [value]; // Single selection
    }
    
    onSelectionChange(newKeys);
    setIsOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-700",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isSelected && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
        className
      )}
    >
      {startContent}
      <div className="flex-1 min-w-0">
        <div className="truncate">{children}</div>
        {description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {description}
          </div>
        )}
      </div>
      {isSelected && (
        <Check size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
      )}
      {endContent}
    </button>
  );
}

// Placeholder components for compatibility
export const SelectGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
SelectGroup.displayName = "SelectGroup";

export const SelectValue = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
SelectValue.displayName = "SelectValue";

export const SelectTrigger = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
SelectContent.displayName = "SelectContent";

export const SelectLabel = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
SelectLabel.displayName = "SelectLabel";

export const SelectSeparator = () => null;
SelectSeparator.displayName = "SelectSeparator";

export const SelectScrollUpButton = () => null;
SelectScrollUpButton.displayName = "SelectScrollUpButton";

export const SelectScrollDownButton = () => null;
SelectScrollDownButton.displayName = "SelectScrollDownButton";