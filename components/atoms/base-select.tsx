"use client";

import * as React from "react";
import ReactSelect, {
  type GroupBase,
  type Props as ReactSelectProps,
} from "react-select";
import { cn } from "@/lib/client/util";

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  isDisabled?: boolean;
};

type BaseReactSelectProps = ReactSelectProps<
  SelectOption,
  false,
  GroupBase<SelectOption>
>;

export type BaseSelectProps = Omit<
  BaseReactSelectProps,
  "classNames" | "isMulti" | "styles" | "theme" | "unstyled"
> & {
  options: SelectOption[];
};

const selectClassNames: NonNullable<BaseReactSelectProps["classNames"]> = {
  clearIndicator: () =>
    "px-2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
  control: ({ isDisabled, isFocused }) =>
    cn(
      "h-full min-h-full rounded-lg border bg-white transition dark:bg-slate-950",
      isFocused
        ? "border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-500/20"
        : "border-slate-200 dark:border-slate-700",
      isDisabled
        ? "cursor-not-allowed bg-slate-50 opacity-70 dark:bg-slate-900"
        : "cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
    ),
  dropdownIndicator: ({ isFocused }) =>
    cn(
      "px-2 transition",
      isFocused
        ? "text-indigo-600 dark:text-indigo-300"
        : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
    ),
  groupHeading: () =>
    "px-2.5 pb-1 pt-2 text-xs font-medium uppercase text-slate-400 dark:text-slate-500",
  indicatorsContainer: () => "h-full",
  indicatorSeparator: () => "hidden",
  input: () => "m-0 p-0 text-slate-900 dark:text-slate-100",
  menu: () =>
    "z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900",
  menuList: () => "scroll-thin max-h-56 p-1",
  noOptionsMessage: () => "px-3 py-2 text-slate-400 dark:text-slate-500",
  option: ({ isDisabled, isFocused, isSelected }) =>
    cn(
      "rounded-md px-2.5 py-2 outline-none transition",
      isDisabled && "cursor-not-allowed text-slate-300 dark:text-slate-600",
      !isDisabled && "cursor-pointer",
      isSelected && "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200",
      !isSelected && isFocused && "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
      !isSelected && !isFocused && !isDisabled && "text-slate-700 dark:text-slate-200"
    ),
  placeholder: () => "m-0 text-slate-400 dark:text-slate-500",
  singleValue: () => "m-0 text-slate-900 dark:text-slate-100",
  valueContainer: () => "h-full px-3 py-0",
};

function hasUtilityClass(className: string | undefined, prefix: string) {
  return new RegExp(`(?:^|\\s)${prefix}-`).test(className ?? "");
}

function hasTextSizeClass(className: string | undefined) {
  return /(?:^|\s)text-(?:xs|sm|base|lg|xl|\d)/.test(className ?? "");
}

export function optionToPlainText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(optionToPlainText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return optionToPlainText(node.props.children);
  }
  return "";
}

export function BaseSelect({
  className,
  instanceId,
  isSearchable = false,
  ...props
}: BaseSelectProps) {
  const generatedInstanceId = React.useId();

  return (
    <ReactSelect<SelectOption, false, GroupBase<SelectOption>>
      unstyled
      className={cn(
        !hasUtilityClass(className, "h") && "h-10",
        !hasUtilityClass(className, "w") && "w-full",
        !hasTextSizeClass(className) && "text-sm",
        className
      )}
      classNames={selectClassNames}
      formatOptionLabel={(option) => option.label}
      getOptionLabel={(option) => optionToPlainText(option.label) || option.value}
      getOptionValue={(option) => option.value}
      instanceId={instanceId ?? generatedInstanceId}
      isOptionDisabled={(option) => option.isDisabled === true}
      isSearchable={isSearchable}
      {...props}
    />
  );
}
