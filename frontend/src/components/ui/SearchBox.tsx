import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import SearchIcon from "@mui/icons-material/Search";

import type { KeyboardEvent } from "react";

type SearchBoxProps = {
  placeholder?: string;
  buttonLabel?: string;
  onSearch?: (query: string) => void;
};



const SearchBox = ({
  placeholder = "Search for Certifications",
  buttonLabel = "Search",
  onSearch,
}: SearchBoxProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    onSearch?.(query.trim());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "stretch",
          width: "100%",
          maxWidth: 760,
          overflow: "hidden",
          borderRadius: "14px",
          border: "1px solid #d8e1eb",
          boxShadow: "0 4px 18px rgba(15, 23, 42, 0.08)",
          backgroundColor: "#ffffff",
        }}
      >
        <OutlinedInput
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "#6b7280" }} />
            </InputAdornment>
          }
          sx={{
            flex: 1,
            borderRadius: 0,
            fontSize: "1rem",
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& input": {
              py: 1.75,
            },
          }}
        />
        <Button
          type="button"
          variant="contained"
          onClick={handleSearch}
          sx={{
            minWidth: { xs: 100, sm: 120 },
            px: { xs: 2.5, sm: 3.5 },
            borderRadius: 0,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "1rem",
            boxShadow: "none",
            bgcolor: "#0b74f5",
            "&:hover": {
              bgcolor: "#095fd0",
              boxShadow: "none",
            },
          }}
        >
          {buttonLabel}
        </Button>
      </Paper>
    </Box>
  );
};

export default SearchBox;