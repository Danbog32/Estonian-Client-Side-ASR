"use client";

import type { ReactNode, ComponentType } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from "@heroui/react";
import { Icons } from "../icons";

type DrawerPlacement = "left" | "right";

type SettingsDrawerShellProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  subtitle: string;
  closeLabel: string;
  placement?: DrawerPlacement;
  children: ReactNode;
};

type SettingsSectionProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: ReactNode;
  showDivider?: boolean;
};

type SettingsSliderFieldProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  valueLabel: string;
  minValue: number;
  maxValue: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
};

type SettingsColorInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type SharedColorPreset = {
  key: string;
  textColor: string;
  backgroundColor: string;
  label: { en: string; et: string };
};

type SettingsPresetGridProps = {
  presets: readonly SharedColorPreset[];
  language: "en" | "et";
  textColor: string;
  backgroundColor: string;
  onSelect: (preset: SharedColorPreset) => void;
};

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function SettingsDrawerShell({
  isOpen,
  onOpenChange,
  title,
  subtitle,
  closeLabel,
  placement = "right",
  children,
}: SettingsDrawerShellProps) {
  return (
    <Drawer
      placement={placement}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton={true}
    >
      <DrawerContent className="w-[min(420px,100vw)] max-w-[420px] bg-gradient-to-br from-[rgba(20,20,24,0.97)] to-[rgba(26,26,30,0.97)] text-white/95 border-l border-white/10 shadow-[-4px_0_24px_rgba(0,0,0,0.5)] backdrop-blur-[20px]">
        {(onClose) => (
          <>
            <DrawerHeader className="flex items-start justify-between gap-4 border-b border-white/6 bg-gradient-to-b from-white/[0.03] to-transparent px-6 pb-5 pt-6">
              <div className="flex flex-col gap-1">
                <span className="bg-gradient-to-br from-white to-white/85 bg-clip-text text-[1.6rem] font-extrabold tracking-[-0.02em] text-transparent">
                  {title}
                </span>
                <span className="text-sm font-normal text-white/55">
                  {subtitle}
                </span>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-[10px] border border-transparent bg-transparent text-white/70 transition-all duration-200 hover:bg-white/8 hover:text-white/95 focus-visible:outline-2 focus-visible:outline-[rgba(95,163,255,0.9)] focus-visible:outline-offset-2"
                onClick={onClose}
                aria-label={closeLabel}
              >
                <Icons.close className="h-5 w-5" />
              </button>
            </DrawerHeader>

            <DrawerBody className="flex flex-col gap-0 overflow-y-auto p-6 md:p-5">
              {children}
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  showDivider = true,
}: SettingsSectionProps) {
  return (
    <>
      <section className="flex flex-col gap-[1.125rem] pb-6 md:pb-5">
        <div className="flex items-start gap-2.5">
          <div className="grid flex-shrink-0 place-items-center">
            <Icon className="h-[22px] w-[22px] opacity-90" />
          </div>
          <div>
            <h2 className="m-0 text-base font-[650] leading-[1.3] tracking-[-0.01em]">
              {title}
            </h2>
            {description ? (
              <p className="m-0 mt-1 text-[0.85rem] leading-[1.4] text-white/55">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {children}
      </section>

      {showDivider ? <SettingsDivider /> : null}
    </>
  );
}

export function SettingsDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
  );
}

export function SettingsSliderField({
  icon: Icon,
  label,
  valueLabel,
  minValue,
  maxValue,
  step,
  value,
  onChange,
  minLabel,
  maxLabel,
}: SettingsSliderFieldProps) {
  const progress =
    maxValue > minValue
      ? ((value - minValue) / (maxValue - minValue)) * 100
      : 0;

  return (
    <label className="flex cursor-pointer flex-col gap-2.5">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 flex-shrink-0 text-white/60" />
          <span className="text-[0.95rem] font-[650] tracking-[-0.01em] text-white/80">
            {label}
          </span>
        </div>
        <span className="min-w-[94px] rounded-[18px] border border-[rgba(74,144,226,0.6)] bg-[rgba(74,144,226,0.14)] px-4 py-2 text-center text-[0.95rem] font-[700] text-[#72adff] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {valueLabel}
        </span>
      </div>

      <input
        type="range"
        min={minValue}
        max={maxValue}
        step={step}
        value={value}
        aria-label={label}
        className="settings-slider-native"
        style={{
          background: `linear-gradient(90deg, #1f7cff 0%, #68a9ff ${progress}%, rgba(255,255,255,0.12) ${progress}%, rgba(255,255,255,0.12) 100%)`,
        }}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />

      {(minLabel || maxLabel) && (
        <div className="flex justify-between px-1 text-[0.8rem] text-white/45">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </label>
  );
}

export function SettingsColorInput({
  label,
  value,
  onChange,
}: SettingsColorInputProps) {
  return (
    <label className="flex flex-1 cursor-pointer flex-col items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-white/60">
        {label}
      </span>
      <div
        className="relative h-14 w-full cursor-pointer rounded-[14px] border-2 border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(74,144,226,0.5)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          aria-label={label}
        />
      </div>
      <span className="text-[0.7rem] font-mono uppercase text-white/55">
        {value}
      </span>
    </label>
  );
}

export function SettingsPresetGrid({
  presets,
  language,
  textColor,
  backgroundColor,
  onSelect,
}: SettingsPresetGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {presets.map((preset) => {
        const isActive =
          preset.textColor.toLowerCase() === textColor.toLowerCase() &&
          preset.backgroundColor.toLowerCase() === backgroundColor.toLowerCase();

        return (
          <button
            key={preset.key}
            type="button"
            className={cx(
              "flex cursor-pointer flex-col overflow-hidden rounded-[14px] border-[1.5px] bg-white/[0.03] p-0 transition-all duration-[250ms]",
              isActive
                ? "border-[rgba(74,144,226,0.95)] shadow-[0_0_0_1px_rgba(74,144,226,0.2)]"
                : "border-white/10 hover:-translate-y-0.5 hover:border-[rgba(74,144,226,0.4)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
            )}
            onClick={() => onSelect(preset)}
            aria-label={preset.label[language] ?? preset.label.en}
          >
            <div
              className="grid h-[58px] w-full place-items-center text-[1.75rem] font-[750]"
              style={{
                backgroundColor: preset.backgroundColor,
                color: preset.textColor,
              }}
            >
              Aa
            </div>
            <div className="px-2 py-[0.5rem] pb-2.5 text-center text-[0.85rem] font-[650] text-white/80">
              {preset.label[language] ?? preset.label.en}
            </div>
          </button>
        );
      })}
    </div>
  );
}
