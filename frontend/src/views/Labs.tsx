import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { alpha } from "@mui/material/styles";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import GradientBox from "../components/ui/GradientBox";
import api from "../lib/api";

type Lab = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? "Failed to load labs.";
  }

  if (error instanceof Error) return error.message;

  return "Failed to load labs.";
};

const normalizeLabs = (payload: unknown): Lab[] => {
  if (Array.isArray(payload)) return payload as Lab[];

  if (payload && typeof payload === "object" && "data" in payload) {
    const nested = (payload as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as Lab[];
  }

  return [];
};

const LabCard = ({ lab }: { lab: Lab }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: alpha("#0F172A", 0.1),
        backgroundColor: "rgba(255,255,255,0.96)",
        transition: "transform 160ms ease, border-color 160ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "primary.main",
        },
      }}
    >
      <Box sx={{ height: 6, bgcolor: "primary.main" }} />

      <Stack spacing={2} sx={{ p: 2.5, flexGrow: 1 }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 850,
              color: "#111827",
              lineHeight: 1.15,
            }}
          >
            {lab.name}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 1.25,
              color: "text.secondary",
              lineHeight: 1.7,
              minHeight: 72,
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {lab.description?.trim() || "No description provided."}
          </Typography>
        </Box>

        <Box sx={{ mt: "auto" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
            Last updated
          </Typography>

          <Typography variant="body2" sx={{ color: "text.primary", mt: 0.25 }}>
            {formatDateTime(lab.updatedAt)}
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: "1px solid",
          borderColor: alpha("#0F172A", 0.08),
          display: "flex",
          justifyContent: "flex-end",
          backgroundColor: alpha("#F8FAFC", 0.8),
        }}
      >
        <Button
          component={RouterLink}
          to={`/lab-management/lab/${encodeURIComponent(lab.id)}`}
          endIcon={<ArrowForwardIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 800,
            color: "primary.main",
          }}
        >
          Manage
        </Button>
      </Box>
    </Paper>
  );
};

const Labs = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchLabs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/api/labs/");
        const labList = normalizeLabs(response.data);

        if (mounted) setLabs(labList);
      } catch (requestError) {
        console.error("Error fetching labs:", requestError);

        if (mounted) {
          setError(getErrorMessage(requestError));
          setLabs([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLabs();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GradientBox
      sx={{
        minHeight: "calc((100dvh / var(--app-scale, 1)) - var(--app-header-height, 64px))",
        px: 0,
        py: 0,
      }}
    >
      <Box sx={{ maxWidth: 1320, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            mb: 5,
            pb: 4,
            borderBottom: "1px solid",
            borderColor: alpha("#0F172A", 0.12),
          }}
        >
          <Stack
              direction="row"
              justifycontent="space-between"
              alignitems="flex-start"
              spacing={3}
          >
              <Box sx={{ flex: 1 }}>
                  <Typography
                      component="h1"
                      sx={{
                          fontSize: { xs: 36, md: 52 },
                          fontWeight: 900,
                          letterSpacing: -1.2,
                          lineHeight: 1,
                          color: "#111827",
                      }}
                  >
                      Labs
                  </Typography>

                  <Typography
                      variant="body1"
                      sx={{
                          mt: 1.5,
                          maxWidth: 620,
                          color: "text.secondary",
                          lineHeight: 1.7,
                      }}
                  >
                      Manage makerspace labs, tools, trainings, and certification structures.
                  </Typography>

                  <Typography
                      variant="body2"
                      sx={{
                          mt: 1.5,
                          color: "primary.main",
                          fontWeight: 800,
                      }}
                  >
                      {loading ? "Loading labs..." : `${labs.length} lab${labs.length === 1 ? "" : "s"}`}
                  </Typography>
              </Box>

              <Button
                  variant="contained"
                  component={RouterLink}
                  to="/lab-management/lab/add"
                  startIcon={<AddIcon />}
                  sx={{
                      flexShrink: 0,
                      alignSelf: "flex-start",

                      textTransform: "none",
                      fontWeight: 700,

                      borderRadius: 2,

                      px: 2.25,
                      py: 0.75,

                      minHeight: 40,

                      boxShadow: "none",
                  }}
              >
                  Create Lab
              </Button>
          </Stack>
        </Box>

        {error && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha("#dc2626", 0.25),
              background: alpha("#fee2e2", 0.72),
            }}
          >
            <Typography sx={{ color: "#b91c1c", fontWeight: 700 }}>{error}</Typography>
          </Paper>
        )}

        {loading ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha("#0F172A", 0.08),
              textAlign: "center",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Loading labs...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Pulling the current lab list from the database.
            </Typography>
          </Paper>
        ) : !error && labs.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 2,
              border: "1px dashed",
              borderColor: alpha("#0F172A", 0.18),
              textAlign: "center",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              No labs found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2.5 }}>
              Create your first lab to start adding tools and trainings.
            </Typography>

            <Button
              variant="contained"
              component={RouterLink}
              to="/lab-management/lab/add"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 800,
                boxShadow: "none",
              }}
            >
              Create Lab
            </Button>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: { xs: 2.5, md: 4 },
            }}
          >
            {labs.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </Box>
        )}
      </Box>
    </GradientBox>
  );
};

export default Labs;