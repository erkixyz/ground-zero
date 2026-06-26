"use client";

import { useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import ReactCountryFlag from "react-country-flag";

const COUNTRY_CODES = [
  "AF", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI",
  "CV", "KH", "CM", "CA", "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CD", "CR", "HR", "CU", "CY", "CZ",
  "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET",
  "FJ", "FI", "FR",
  "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY",
  "HT", "HN", "HU",
  "IS", "IN", "ID", "IR", "IQ", "IE", "IL", "IT",
  "JM", "JP", "JO",
  "KZ", "KE", "KI", "KP", "KR", "KW", "KG",
  "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU",
  "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM",
  "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "MK", "NO",
  "OM",
  "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT",
  "QA",
  "RO", "RU", "RW",
  "KN", "LC", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY",
  "TW", "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TV",
  "UG", "UA", "AE", "GB", "US", "UY", "UZ",
  "VU", "VE", "VN",
  "YE",
  "ZM", "ZW",
];

type CountryOption = { code: string; label: string };

function buildOptions(locale: string): CountryOption[] {
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  return COUNTRY_CODES
    .map((code) => ({ code, label: displayNames.of(code) ?? code }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}

type Props = {
  label: string;
  locale: string;
  defaultValue?: string | null;
  required?: boolean;
};

export default function CountrySelect({ label, locale, defaultValue, required }: Props) {
  const options = useMemo(() => buildOptions(locale), [locale]);

  const [selected, setSelected] = useState<CountryOption | null>(() =>
    defaultValue ? (options.find((o) => o.code === defaultValue) ?? null) : null
  );

  return (
    <>
      <input type="hidden" name="country" value={selected?.code ?? ""} />
      <Autocomplete
        options={options}
        value={selected}
        onChange={(_, v) => setSelected(v)}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(o, v) => o.code === v.code}
        renderOption={(props, option) => {
          const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
          return (
            <Box key={key} component="li" sx={{ display: "flex", alignItems: "center", gap: 1.5 }} {...rest}>
              <ReactCountryFlag countryCode={option.code} svg style={{ width: "1.4em", height: "1em", flexShrink: 0 }} />
              {option.label}
            </Box>
          );
        }}
        renderInput={(params) => {
          // MUI v9: adornments are in params.slotProps.input (not InputProps)
          const inputSlot = (params.slotProps as Record<string, Record<string, unknown>>)?.input ?? {};
          return (
            <TextField
              {...params}
              label={label}
              required={required}
              slotProps={{
                ...(params.slotProps as object),
                input: {
                  ...inputSlot,
                  startAdornment: selected ? (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", ml: 0.5, mr: 0.25 }}>
                        <ReactCountryFlag countryCode={selected.code} svg style={{ width: "1.4em", height: "1em" }} />
                      </Box>
                      {inputSlot.startAdornment as React.ReactNode}
                    </>
                  ) : (inputSlot.startAdornment as React.ReactNode ?? null),
                },
              }}
            />
          );
        }}
      />
    </>
  );
}
