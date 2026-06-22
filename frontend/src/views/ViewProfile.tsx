import { useState, useEffect, type ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  Collapse,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  CalendarMonthOutlined,
  CheckCircleRounded,
  CancelRounded,
  EmailOutlined,
  ExpandMoreRounded,
  LayersOutlined,
  SchoolOutlined,
  ScienceOutlined,
  VerifiedRounded,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";


import api from "../lib/api";

import GradientBox from "../components/ui/GradientBox";



type TrainingNode = {
  id: string;
  lab: {name: string; id: string};
  labId: string
  name: string
  toolid: string
  type: string
}


type Certification = {
  trainingNode: TrainingNode;
  level: number;
  issuedAt: string;
  instructor: string;
  credentialId: string;
  status: string;
};


type CertsGroupedByLab = {
  labId: string
  labName: string;
  description?: string;
  accent?: string;
  certifications: Certification[];
}


type ProfileField = {
  label: string;
  value: string;
  helper: string;
};

type SectionHeaderProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  accent?: string;
};

type InfoFieldProps = {
  label: string;
  value: string;
  helper: string;
};

type StatCardProps = {
  icon: ReactNode;
  value: string;
  label: string;
  caption: string;
  accent: string;
};

type CertificationCardProps = {
  certification: Certification;
  accent: string;
};


type UserData  = {
  id: string,
  role: string,
  email: string,
  firstName: string,
  lastName: string,
  isUserAgreementComplete: boolean
  userAgreementSource: string,
  createdAt: string,
  certsGroupedByLab: CertsGroupedByLab[]
}



const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const panelSx = {
  p: { xs: 2.25, md: 3 },
  borderRadius: 4,
  border: "1px solid",
  borderColor: alpha("#0F172A", 0.08),
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.88) 100%)",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
  backdropFilter: "blur(10px)",
};

const heroSx = {
  position: "relative",
  overflow: "hidden",
  p: { xs: 2.5, md: 3.5 },
  borderRadius: 5,
  border: "1px solid",
  borderColor: alpha("#2563EB", 0.12),
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(255,255,255,0.96) 46%, rgba(15,118,110,0.10) 100%)",
  boxShadow: "0 28px 70px rgba(15, 23, 42, 0.10)",
};

const SectionHeader = ({ eyebrow, title, description, accent = "#2563EB" }: SectionHeaderProps) => (
  <Stack spacing={0.75}>
    <Typography
      variant="overline"
      sx={{
        color: accent,
        fontWeight: 800,
        letterSpacing: 1.8,
        lineHeight: 1,
      }}
    >
      {eyebrow}
    </Typography>
    <Typography
      component="h2"
      sx={{
        fontSize: { xs: 22, md: 28 },
        fontWeight: 800,
        lineHeight: 1.1,
        color: "text.primary",
      }}
    >
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      {description}
    </Typography>
  </Stack>
);

const InfoField = ({ label, value, helper }: InfoFieldProps) => (
  <Box
    sx={{
      p: 2,
      borderRadius: 3,
      border: "1px solid",
      borderColor: alpha("#2563EB", 0.1),
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.9) 100%)",
      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
    }}
  >
    <Typography
      variant="caption"
      sx={{
        textTransform: "uppercase",
        letterSpacing: 1.2,
        color: "text.secondary",
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body1"
      sx={{
        mt: 0.75,
        fontWeight: 700,
        color: "text.primary",
        wordBreak: "break-word",
      }}
    >
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
      {helper}
    </Typography>
  </Box>
);

const StatCard = ({ icon, value, label, caption, accent }: StatCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.25,
      minHeight: 144,
      borderRadius: 4,
      border: "1px solid",
      borderColor: alpha(accent, 0.16),
      background: `linear-gradient(180deg, ${alpha("#FFFFFF", 0.96)} 0%, ${alpha(accent, 0.05)} 100%)`,
      boxShadow: "0 14px 28px rgba(15, 23, 42, 0.07)",
    }}
  >
    <Stack spacing={1.5} sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            color: accent,
            backgroundColor: alpha(accent, 0.12),
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 1.15,
            color: "text.secondary",
            fontWeight: 700,
            textAlign: "right",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        component="div"
        sx={{
          fontSize: { xs: 24, sm: 30 },
          fontWeight: 800,
          lineHeight: 1.05,
          color: "text.primary",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: "auto", lineHeight: 1.6 }}>
        {caption}
      </Typography>
    </Stack>
  </Paper>
);

const CertificationCard = ({ certification, accent }: CertificationCardProps) => (
  <Box
    sx={{
      position: "relative",
      overflow: "hidden",
      p: 2,
      borderRadius: 3,
      border: "1px solid",
      borderColor: alpha(accent, 0.16),
      background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)",
      boxShadow: "0 10px 22px rgba(15, 23, 42, 0.05)",
    }}
  >
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `linear-gradient(90deg, ${alpha(accent, 0.08)} 0%, transparent 18%)`,
      }}
    />
    <Stack spacing={1.25} sx={{ position: "relative" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
            {certification.trainingNode.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Credential {certification.credentialId}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`Level ${certification.level}`}
          sx={{
            bgcolor: alpha(accent, 0.12),
            color: accent,
            fontWeight: 700,
          }}
        />
      </Box>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Chip
          size="small"
          variant="outlined"
          icon={<CalendarMonthOutlined fontSize="small" />}
          label={formatDate(certification.issuedAt)}
        />
        <Chip
          size="small"
          variant="outlined"
          icon={<SchoolOutlined fontSize="small" />}
          label={certification.instructor}
        />
        <Chip
          size="small"
          variant="outlined"
          icon={<CheckCircleRounded fontSize="small" />}
          label={certification.status}
          sx={{
            borderColor: alpha("#059669", 0.25),
            bgcolor: alpha("#059669", 0.08),
            color: "#047857",
            fontWeight: 700,
          }}
        />
      </Stack>
    </Stack>
  </Box>
);

const LabSection = ({ group }: { group: CertsGroupedByLab }) => {
  console.log("group: ",group)
  const [expanded, setExpanded] = useState(true);
  const accent = "#059669"
  const latestCertification = group.certifications.reduce<Certification | null>((latest, certification) => {
    console.log(latest)
    if (!latest) {
      return certification;
    }
    return new Date(certification.issuedAt).getTime() > new Date(latest.issuedAt).getTime()
      ? certification
      : latest;
  }, null);
  const panelId = group.labName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 4,
        border: "1px solid",
        borderColor: alpha(accent, 0.16),
        background: `linear-gradient(180deg, ${alpha(accent, 0.06)} 0%, rgba(255,255,255,0.82) 100%)`,
      }}
    >
      <ButtonBase
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls={`${panelId}-content`}
        aria-label={`Toggle ${group.labName} certifications`}
        sx={{
          width: "100%",
          display: "block",
          borderRadius: 3,
          textAlign: "left",
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: alpha(accent, 0.55),
            outlineOffset: 2,
          },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                backgroundColor: alpha(accent, 0.12),
                color: group.accent,
                flexShrink: 0,
              }}
            >
              <ScienceOutlined />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {group.labName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {group.description}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
            <Chip
              size="small"
              label={`${group.certifications.length} certs`}
              sx={{
                bgcolor: alpha(accent, 0.1),
                color: group.accent,
                fontWeight: 700,
              }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Latest ${latestCertification ? formatDate(latestCertification.issuedAt) : "N/A"}`}
              sx={{
                borderColor: alpha(accent, 0.24),
                bgcolor: alpha("#FFFFFF", 0.9),
              }}
            />
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                color: group.accent,
                backgroundColor: alpha(accent, 0.08),
                transition: "transform 180ms ease, background-color 180ms ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <ExpandMoreRounded />
            </Box>
          </Stack>
        </Stack>
      </ButtonBase>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box id={`${panelId}-content`} sx={{ pt: 2 }}>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            {group.certifications.map((certification) => (
              <CertificationCard
                key={certification.credentialId}
                certification={certification}
                accent={accent}
              />
            ))}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};





const Profile = () => {
  const [userData, setUserData] = useState<UserData| null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false)


   useEffect( () => {
    const fetchUserProfile = async () => {
      try {
        const reponse = await api.get("/api/user/profile");
        const data = await reponse.data.data;
        setUserData(data);
      } catch (error) {
          console.error("Error fetching user profile:", error);
          setError(true)
      } finally {
      setLoading(false);
    }
    }
    fetchUserProfile();
  }, [] )


  if (loading) {
    return (
      <Box sx={{display: "flex", justifyContent: "Center", alignItems: "Center" }}>
        <Typography> Loading...</Typography>
      </Box>
    )
  }

  if (error) {
    return  (   
      <Box sx={{display: "flex", justifyContent: "Center", alignItems: "Center" }}>
          <Typography> Loading...</Typography>
      </Box>
    )
  }

  if (!userData) {
    return (
      <Box sx={{display: "flex", justifyContent: "Center", alignItems: "Center" }}>
          <Typography> This user was not found! </Typography>
      </Box>
    )
  }
  console.log("User Data", userData)
  console.log(
    JSON.stringify(userData.certsGroupedByLab, null, 2)
  );
  const allCertifications: Certification[] = []
  userData.certsGroupedByLab.flatMap(lab => lab.certifications)
  const totalCertifications = allCertifications.length;
  const labsCertifiedIn = userData.certsGroupedByLab.length;
  const highestLevel = allCertifications.reduce(
    (maxLevel, certification) => Math.max(maxLevel, certification.level),
    0,
  );
  const latestCertification = allCertifications.reduce<Certification | null>(
    (latest, certification) => {
      if (!latest) {
        return certification;
      }

      return new Date(certification.issuedAt).getTime() > new Date(issuedAt).getTime()
        ? certification
        : latest;
    },
    null,
  );


  const accountFields: ProfileField[] = [
  {
    label: "User ID",
    value: userData.id,
    helper: "Unique identifier stored on the user record.",
  },
  {
    label: "First Name",
    value: userData.firstName,
    helper: "Given name stored in the user table.",
  },
  {
    label: "Last Name",
    value: userData.lastName,
    helper: "Family name stored in the user table.",
  },
  {
    label: "Agreement Source",
    value: userData.userAgreementSource ?? "Not provided",
    helper: "Source recorded when the agreement was completed.",
  },
  {
    label: "Member since",
    value: formatDate(userData.createdAt),
    helper: "Creation timestamp from the user model.",
  },
];

  return (
    <GradientBox sx={{ minHeight: "calc(100vh - 72px)", position: "relative", overflow: "hidden" }}>
      <Box sx={{ maxWidth: 1440, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        <Paper sx={heroSx} elevation={0}>
          <Box
            sx={{
              position: "absolute",
              top: -90,
              right: -60,
              width: 260,
              height: 260,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -100,
              left: -80,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(15,118,110,0.16) 0%, rgba(15,118,110,0) 68%)",
            }}
          />
          <Box
            sx={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.35fr) minmax(340px, 0.85fr)" },
              gap: 3,
              alignItems: "center",
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2.25} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                  <Avatar
                    sx={{
                      width: 96,
                      height: 96,
                      fontSize: 34,
                      fontWeight: 800,
                      color: "#FFFFFF",
                      background: "linear-gradient(135deg, #2563EB 0%, #0F766E 100%)",
                      boxShadow: "0 18px 35px rgba(37, 99, 235, 0.24)",
                    }}
                  >
                    {userData.firstName}
                    {userData.lastName }
                  </Avatar>
                  <Box
                    sx={{
                      position: "absolute",
                      right: -3,
                      bottom: -3,
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: "#FFFFFF",
                      border: "2px solid #FFFFFF",
                      color: "#059669",
                      boxShadow: "0 8px 18px rgba(15, 23, 42, 0.14)",
                    }}
                  >
                    <VerifiedRounded fontSize="small" />
                  </Box>
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "primary.main",
                      fontWeight: 800,
                      letterSpacing: 2,
                      lineHeight: 1,
                    }}
                  >
                    Safety profile
                  </Typography>
                  <Typography
                    component="h1"
                    sx={{
                      mt: 0.75,
                      fontSize: { xs: 34, sm: 42, md: 54 },
                      fontWeight: 800,
                      lineHeight: 1.05,
                      letterSpacing: -1,
                      color: "text.primary",
                      wordBreak: "break-word",
                    }}
                  >
                    {userData.firstName} {userData.lastName}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      mt: 1,
                      color: "text.secondary",
                      lineHeight: 1.7,
                      maxWidth: 720,
                    }}
                  >
                    This profile is limited to the fields exposed by the user schema, with related
                    certification history shown separately below.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip
                  icon={<EmailOutlined fontSize="small" />}
                  label={userData.email}
                  variant="outlined"
                  sx={{
                    borderColor: alpha("#2563EB", 0.2),
                    bgcolor: alpha("#FFFFFF", 0.7),
                  }}
                />
                <Chip
                  label={userData.role}
                  variant="outlined"
                  sx={{
                    borderColor: alpha("#0F766E", 0.2),
                    bgcolor: alpha("#FFFFFF", 0.7),
                  }}
                />
                <Chip icon={
                  userData.isUserAgreementComplete
                    ? <CheckCircleRounded fontSize="small" />
                    : <CancelRounded fontSize="small" />
                }  
                  label={userData.isUserAgreementComplete ? "Agreement complete" : "Agreement pending"}
                  variant="outlined"
                  sx={{
                    borderColor: alpha("#D97706", 0.2),
                    bgcolor: alpha("#FFFFFF", 0.7),
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Button variant="contained" size="large" sx={{ px: 3 }}>
                  Edit profile
                </Button>
                <Button variant="outlined" size="large" sx={{ px: 3 }}>
                  View certifications
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 1.5,
              }}
            >
              <StatCard
                icon={<WorkspacePremiumOutlined fontSize="small" />}
                value={`${totalCertifications}`}
                label="total certifications"
                caption="All active credentials shown in this mock profile."
                accent="#2563EB"
              />
              <StatCard
                icon={<LayersOutlined fontSize="small" />}
                value={`${labsCertifiedIn}`}
                label="labs covered"
                caption="Each lab acts as its own certification category."
                accent="#D97706"
              />
              <StatCard
                icon={<SchoolOutlined fontSize="small" />}
                value={`Level ${highestLevel}`}
                label="highest level"
                caption="A quick read on the most advanced credential earned."
                accent="#0F766E"
              />
              <StatCard
                icon={<CalendarMonthOutlined fontSize="small" />}
                value={latestCertification ? formatDate(latestCertification.issuedAt) : "N/A"}
                label="latest completion"
                caption="Most recent certification completion date."
                accent="#059669"
              />
            </Box>
          </Box>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "360px minmax(0, 1fr)" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Stack spacing={3}>
            <Paper sx={panelSx} elevation={0}>
              <SectionHeader
                eyebrow="Account snapshot"
                title="Profile details"
                description="Only fields from the User schema are shown here."
              />
              <Divider sx={{ my: 2.25 }} />
              <Stack spacing={1.5}>
                {accountFields.map((field) => (
                  <InfoField key={field.label} label={field.label} value={field.value} helper={field.helper} />
                ))}
              </Stack>
            </Paper>

            <Paper sx={panelSx} elevation={0}>
              <SectionHeader
                eyebrow="Agreement"
                title="Compliance status"
                description="Agreement metadata lives directly on the user record."
                accent="#0F766E"
              />
              <Divider sx={{ my: 2.25 }} />
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  The profile stores a boolean agreement flag, the source used to capture it, and the
                  record creation date.
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip
                    icon={<CheckCircleRounded fontSize="small" />}
                    label={userData.isUserAgreementComplete ? "Agreement complete" : "Agreement pending"}
                    variant="outlined"
                    sx={{
                      borderColor: alpha("#059669", 0.24),
                      bgcolor: alpha("#059669", 0.08),
                      color: "#047857",
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    icon={<VerifiedRounded fontSize="small" />}
                    label={userData.userAgreementSource ?? "No agreement source"}
                    variant="outlined"
                    sx={{
                      borderColor: alpha("#2563EB", 0.24),
                      bgcolor: alpha("#2563EB", 0.08),
                      color: "#1D4ED8",
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    icon={<CalendarMonthOutlined fontSize="small" />}
                    label={formatDate(userData.createdAt)}
                    variant="outlined"
                    sx={{
                      borderColor: alpha("#D97706", 0.24),
                      bgcolor: alpha("#D97706", 0.08),
                      color: "#B45309",
                      fontWeight: 700,
                    }}
                  />
                </Stack>
              </Stack>
            </Paper>
          </Stack>

          <Paper sx={{...panelSx}} elevation={0}>
              <SectionHeader
                title="Certification History & User Agreement"
                accent="#2563EB"
              />
              <Typography variant="h6" sx={{ mb: 2, lineHeight: 1.7, color: userData.isUserAgreementComplete ? "green" : "red",}}>
                {userData.isUserAgreementComplete
                ? "This user has completed the user agreement"
                : "This user has not completed the user agreement"}
              </Typography>
            <SectionHeader
              eyebrow="Certifications"
              description="Grouped by lab, with key stats surfaced for quick scanning."
              accent="#2563EB"
            />

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 2.25, mb: 2.5 }}>
              <Chip label={`${totalCertifications} certifications`} />
              <Chip label={`${labsCertifiedIn} labs`} />
              <Chip label={`Highest level ${highestLevel}`} />
            </Stack>

            <Stack spacing={2}>
              {userData.certsGroupedByLab.map((group: CertsGroupedByLab) => (
                <LabSection key={group.labId} group={group} />
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>
    </GradientBox>
  );
};

export default Profile;
