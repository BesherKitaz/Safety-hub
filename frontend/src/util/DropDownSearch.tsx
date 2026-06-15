import { useState, useEffect } from 'react'
import {
    TextField,
    Autocomplete,
    Box,
} from '@mui/material'



type DropDownSearchProps<T> = {
  label: string;
  fetchOptions: (search: string) => Promise<T[]>;
  getOptionLabel: (option: T) => string;
  onChange?: (value: T | null) => void;
  minChars?: number;
};

const DropDownSearch = <T,>({
  label,
  fetchOptions,
  getOptionLabel,
  onChange,
  minChars = 2,
}: DropDownSearchProps<T>) => {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.trim().length < minChars) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await fetchOptions(search);
        setOptions(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error("Dropdown search failed:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, fetchOptions, minChars]);

  return (
    <Box>
      <Autocomplete
        options={options}
        loading={loading}
        getOptionLabel={getOptionLabel}
        onInputChange={(_, value) => setSearch(value)}
        onChange={(_, value) => onChange?.(value)}
        renderInput={(params) => <TextField {...params} label={label} />}
      />
    </Box>
  );
};

export default DropDownSearch;
