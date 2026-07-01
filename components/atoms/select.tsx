"use client";

import * as React from "react";
import type { SingleValue } from "react-select";
import {
  BaseSelect,
  optionToPlainText,
  type SelectOption,
} from "@/components/atoms/base-select";

export function Select({
  className,
  children,
  defaultValue,
  disabled,
  id,
  name,
  onChange,
  options,
  placeholder,
  required,
  value,
  ...props
}: Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children" | "defaultValue" | "multiple" | "onChange" | "size" | "value"
> & {
  children?: React.ReactNode;
  defaultValue?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  placeholder?: string;
  value?: string | number;
}) {
  const selectOptions = React.useMemo(
    () => options ?? optionsFromChildren(children),
    [children, options]
  );
  const currentValue = value === undefined ? undefined : String(value);
  const currentOption =
    currentValue === undefined
      ? undefined
      : findOption(selectOptions, currentValue);
  const defaultOption =
    currentValue === undefined && defaultValue !== undefined
      ? findOption(selectOptions, String(defaultValue))
      : undefined;
  const disabledPlaceholder =
    currentOption?.value === "" && currentOption.isDisabled
      ? currentOption
      : undefined;

  function handleChange(option: SingleValue<SelectOption>) {
    const nextValue = option?.value ?? "";
    onChange?.({
      currentTarget: { name, value: nextValue },
      target: { name, value: nextValue },
    } as React.ChangeEvent<HTMLSelectElement>);
  }

  return (
    <BaseSelect
      aria-invalid={props["aria-invalid"]}
      aria-label={props["aria-label"]}
      aria-labelledby={props["aria-labelledby"]}
      autoFocus={props.autoFocus}
      className={className}
      defaultValue={defaultOption}
      inputId={id}
      isDisabled={disabled}
      name={name}
      onBlur={props.onBlur as never}
      onChange={handleChange}
      onFocus={props.onFocus as never}
      options={selectOptions}
      placeholder={
        placeholder ??
        (disabledPlaceholder
          ? optionToPlainText(disabledPlaceholder.label)
          : undefined)
      }
      required={required}
      tabIndex={props.tabIndex}
      {...(currentValue === undefined
        ? {}
        : { value: disabledPlaceholder ? null : (currentOption ?? null) })}
    />
  );
}

function findOption(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value);
}

function optionsFromChildren(children: React.ReactNode): SelectOption[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child)) {
      return [];
    }

    const optionValue =
      child.props.value === undefined
        ? optionToPlainText(child.props.children)
        : String(child.props.value);

    return [
      {
        value: optionValue,
        label: child.props.children,
        isDisabled: child.props.disabled,
      },
    ];
  });
}
