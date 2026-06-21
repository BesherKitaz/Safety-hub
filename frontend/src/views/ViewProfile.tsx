import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  BadgeOutlined,
  CalendarMonthOutlined,
  CheckCircleRounded,
  EmailOutlined,
  LayersOutlined,
  LocationOnOutlined,
  SchoolOutlined,
  ScienceOutlined,
  VerifiedRounded,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";

import GradientBox from "../components/ui/GradientBox";

type Certification = {
  training: string;
  level: number;
  issuedOn: string;
  instructor: string;
  credentialId: string;
  status: string;
};

type LabCertificationGroup = {
  labName: string;
  description: string;
  accent: string;
  certifications: Certification[];
};

type ProfileField = {
  label: string;
  value: string;
  helper: string;
};

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
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

const profile = {
  firstName: "Sarah",
  lastName: "Nguyen",
  email: "staff.sarah@purdue.edu",
  role: "Lab Safety Coordinator",
  department: "Engineering Safety Office",
  location: "MSEE 112",
  badgeId: "LAB-4216",
  memberSince: "2025-09-15T12:00:00Z",
  supervisor: "Dr. Elena Torres",
  accessStatus: "Active",
  agreementStatus: "Signed",
  lastLogin: "Today, 08:14 AM",
  userId: "cmccw8g240000l9046e9z8abc",
};

const certificationGroups: LabCertificationGroup[] = [
  {
    labName: "Electronics Lab",
    description: "Soldering, instrumentation, and circuit build safety.",
    accent: "#2563EB",
    certifications: [
      {
        training: "Soldering Fundamentals",
        level: 2,
        issuedOn: "2026-06-01T12:00:00Z",
        instructor: "Maria Carter",
        credentialId: "EL-2048",
        status: "Verified",
      },
      {
        training: "Oscilloscope Operation",
        level: 1,
        issuedOn: "2026-04-18T12:00:00Z",
        instructor: "Maria Carter",
        credentialId: "EL-1982",
        status: "Verified",
      },
      {
        training: "PCB Rework Safety",
        level: 1,
        issuedOn: "2026-02-10T12:00:00Z",
        instructor: "Kiran Patel",
        credentialId: "EL-1904",
        status: "Verified",
      },
    ],
  },
  {
    labName: "Woodshop",
    description: "Cutting tools, extraction, and PPE discipline.",
    accent: "#D97706",
    certifications: [
      {
        training: "Bandsaw Operation",
        level: 1,
        issuedOn: "2026-05-11T12:00:00Z",
        instructor: "Ryan Hayes",
        credentialId: "WS-1120",
        status: "Verified",
      },
      {
        training: "Table Saw Precision",
        level: 2,
        issuedOn: "2026-03-09T12:00:00Z",
        instructor: "Ryan Hayes",
        credentialId: "WS-1088",
        status: "Verified",
      },
      {
        training: "Dust Collection and PPE",
        level: 1,
        issuedOn: "2025-12-08T12:00:00Z",
        instructor: "Jenna Kim",
        credentialId: "WS-1002",
        status: "Verified",
      },
    ],
  },
  {
    labName: "Metal Shop",
    description: "Rotary equipment, milling, and finishing safety.",
    accent: "#0F766E",
    certifications: [
      {
        training: "Lathe Basics",
        level: 1,
        issuedOn: "2026-01-22T12:00:00Z",
        instructor: "Aiden Brooks",
        credentialId: "MS-9011",
        status: "Verified",
      },
      {
        training: "Milling Machine Setup",
        level: 2,
        issuedOn: "2026-04-29T12:00:00Z",
        instructor: "Aiden Brooks",
        credentialId: "MS-9124",
        status: "Verified",
      },
      {
        training: "Grinding and Deburr Safety",
        level: 1,
        issuedOn: "2026-05-20T12:00:00Z",
        instructor: "Nora Ortiz",
        credentialId: "MS-9205",
        status: "Verified",
      },
    ],
  },
  {
    labName: "Chemical Lab",
    description: "Ventilation, handling, and controlled chemical workflows.",
    accent: "#059669",
    certifications: [
      {
        training: "Fume Hood Operations",
        level: 2,
        issuedOn: "2026-05-27T12:00:00Z",
        instructor: "Dr. Dana Wong",
        credentialId: "CL-3304",
        status: "Verified",
      },
      {
        training: "Chemical Handling",
        level: 1,
        issuedOn: "2026-02-14T12:00:00Z",
        instructor: "Dr. Dana Wong",
        credentialId: "CL-3210",
        status: "Verified",
      },
    ],
  },
];

const allCertifications = certificationGroups.flatMap((group) => group.certifications);
const totalCertifications = allCertifications.length;
const labsCertifiedIn = certificationGroups.length;
const highestLevel = allCertifications.reduce(
  (maxLevel, certification) => Math.max(maxLevel, certification.level),
  0,
);
const latestCertification = allCertifications.reduce<Certification | null>(
  (latest, certification) => {
    if (!latest) {
      return certification;
    }

    return new Date(certification.issuedOn).getTime() > new Date(latest.issuedOn).getTime()
      ? certification
      : latest;
  },
  null,
);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const formatMonthYear = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
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
      background: `linear-gradient(180deg, ${alpha("#FFFFFF", 0.96)} 0%, ${alpha(
        accent,
        0.05,
      )} 100%)`,
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
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)",
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
            {certification.training}
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
          label={formatDate(certification.issuedOn)}
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

const LabSection = ({ group }: { group: LabCertificationGroup }) => {
  const latestCertification = group.certifications.reduce<Certification | null>((latest, certification) => {
    if (!latest) {
      return certification;
    }

    return new Date(certification.issuedOn).getTime() > new Date(latest.issuedOn).getTime()
      ? certification
      : latest;
  }, null);

  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 4,
        border: "1px solid",
        borderColor: alpha(group.accent, 0.16),
        background: `linear-gradient(180deg, ${alpha(group.accent, 0.06)} 0%, rgba(255,255,255,0.82) 100%)`,
      }}
    >
      <Stack spacing={2}>
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
                backgroundColor: alpha(group.accent, 0.12),
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
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={`${group.certifications.length} certs`}
              sx={{
                bgcolor: alpha(group.accent, 0.1),
                color: group.accent,
                fontWeight: 700,
              }}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Latest ${latestCertification ? formatDate(latestCertification.issuedOn) : "N/A"}`}
              sx={{
                borderColor: alpha(group.accent, 0.24),
                bgcolor: alpha("#FFFFFF", 0.9),
              }}
            />
          </Stack>
        </Stack>
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
              accent={group.accent}
            />
          ))}
        </Box>
      </Stack>
    </Box>
  );
};

const accountFields: ProfileField[] = [
  {
    label: "User ID",
    value: profile.userId,
    helper: "Internal identity used for profile sync and audit trails.",
  },
  {
    label: "Department",
    value: profile.department,
    helper: "Primary team and operational home for this account.",
  },
  {
    label: "Badge ID",
    value: profile.badgeId,
    helper: "Physical access badge identifier for lab entry.",
  },
  {
    label: "Member Since",
    value: formatMonthYear(profile.memberSince),
    helper: "Joined the safety program and certification roster.",
  },
  {
    label: "Supervisor",
    value: profile.supervisor,
    helper: "Current reporting line for approvals and review.",
  },
  {
    label: "Access Status",
    value: profile.accessStatus,
    helper: `Agreement ${profile.agreementStatus.toLowerCase()} and last login ${profile.lastLogin}.`,
  },
];

const Profile = () => {
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
              background:
                "radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)",
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
              background:
                "radial-gradient(circle, rgba(15,118,110,0.16) 0%, rgba(15,118,110,0) 68%)",
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
                    SN
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
                    {profile.firstName} {profile.lastName}
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
                    {profile.role} for the {profile.department}. This layout is optimized to make
                    the account summary, access context, and certification history easy to scan at a glance.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip
                  icon={<EmailOutlined fontSize="small" />}
                  label={profile.email}
                  variant="outlined"
                  sx={{
                    borderColor: alpha("#2563EB", 0.2),
                    bgcolor: alpha("#FFFFFF", 0.7),
                  }}
                />
                <Chip
                  icon={<LocationOnOutlined fontSize="small" />}
                  label={profile.location}
                  variant="outlined"
                  sx={{
                    borderColor: alpha("#0F766E", 0.2),
                    bgcolor: alpha("#FFFFFF", 0.7),
                  }}
                />
                <Chip
                  icon={<BadgeOutlined fontSize="small" />}
                  label={`Badge ${profile.badgeId}`}
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
                  View badge
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
                value={latestCertification ? formatDate(latestCertification.issuedOn) : "N/A"}
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
                description="A polished summary of the user record and access context."
              />
              <Divider sx={{ my: 2.25 }} />
              <Stack spacing={1.5}>
                {accountFields.map((field) => (
                  <InfoField
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    helper={field.helper}
                  />
                ))}
              </Stack>
            </Paper>

            <Paper sx={panelSx} elevation={0}>
              <SectionHeader
                eyebrow="Readiness"
                title="Safety posture"
                description="A small visual break between identity details and the certification history."
                accent="#0F766E"
              />
              <Divider sx={{ my: 2.25 }} />
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  This sample content keeps the layout feeling complete while leaving room for your
                  live data to drop in later without changing the structure.
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Chip
                    icon={<CheckCircleRounded fontSize="small" />}
                    label="PPE training current"
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
                    label="Agreement on file"
                    variant="outlined"
                    sx={{
                      borderColor: alpha("#2563EB", 0.24),
                      bgcolor: alpha("#2563EB", 0.08),
                      color: "#1D4ED8",
                      fontWeight: 700,
                    }}
                  />
                  <Chip
                    icon={<WorkspacePremiumOutlined fontSize="small" />}
                    label="Access active"
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

          <Paper sx={panelSx} elevation={0}>
            <SectionHeader
              eyebrow="Certifications"
              title="Grouped by lab"
              description="All obtained certifications are organized by lab category so users can scan the full record without searching through a long list."
              accent="#2563EB"
            />

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 2.25, mb: 2.5 }}>
              <Chip label={`${totalCertifications} certifications`} />
              <Chip label={`${labsCertifiedIn} labs`} />
              <Chip label={`Highest level ${highestLevel}`} />
            </Stack>

            <Stack spacing={2}>
              {certificationGroups.map((group) => (
                <LabSection key={group.labName} group={group} />
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>
    </GradientBox>
  );
};

export default Profile;


