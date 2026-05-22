"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTask } from "@/hooks/use-create-task";
import {
  useTaskSuggestions,
  type Suggestion,
} from "@/hooks/use-task-suggestions";
import { useAuthStore } from "@/stores/use-auth.store";
import { useMissionWizardStore } from "@/stores/use-mission-wizard.store";
import { useTaskFormStore } from "@/stores/use-task-form.store";
import L from "leaflet";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResourceSelectionList } from "./ResourcesSelectionList";
import { SuggestionList } from "./SuggestionList";

enum MissionType {
  RESCUE = "rescue",
  EVACUATION = "evacuation",
  RESOURCE_DELIVERY = "resource_delivery",
  MEDICAL = "medical",
  OTHER = "other",
}

const REGION_BOXES: { region: string; box: [number, number, number, number] }[] = [
  { region: "kharkiv",      box: [49.0, 35.5, 50.4, 38.0] },
  { region: "luhansk",      box: [47.8, 37.8, 50.0, 40.2] },
  { region: "donetsk",      box: [47.0, 36.5, 49.2, 39.0] },
  { region: "zaporizhzhia", box: [46.5, 34.0, 48.2, 37.5] },
  { region: "kherson",      box: [45.2, 31.8, 47.5, 34.8] },
];

function inferRegion(lat: number, lng: number): string {
  for (const { region, box } of REGION_BOXES) {
    if (lat >= box[0] && lng >= box[1] && lat <= box[2] && lng <= box[3]) return region;
  }
  return "other";
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ua`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
  } catch {
    return null;
  }
}

enum MissionPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}
enum MissionDifficulty {
  ROUTINE = "routine",
  COMPLEX = "complex",
  HAZARDOUS = "hazardous",
}

const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  rescue: "Rescue",
  evacuation: "Evacuation",
  resource_delivery: "Resource Delivery",
  medical: "Medical Aid",
  other: "Other",
};

const MISSION_TYPE_DESCRIPTIONS: Record<MissionType, string> = {
  rescue: "Find and extract person(s) in danger",
  evacuation: "Move people out of a dangerous area",
  resource_delivery: "Transport supplies or equipment to a location",
  medical: "Provide on-site medical assistance",
  other: "Custom mission type",
};

const MISSION_TYPE_DEFAULT_SKILLS: Record<MissionType, string[]> = {
  rescue: ["medic", "driver"],
  evacuation: ["driver", "coordinator"],
  resource_delivery: ["driver", "mechanic"],
  medical: ["medic"],
  other: [],
};

const allSkills = [
  "medic",
  "driver",
  "translator",
  "coordinator",
  "electrician",
  "mechanic",
  "cook",
  "engineer",
];

interface MissionParameters {
  title: string;
  description: string;
  missionType: MissionType;
  region: string;
  priority: MissionPriority;
  difficulty: MissionDifficulty;
  requiredSkills: string[];
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
}

export function TaskFormColumn() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [step, setStep] = useState<"define" | "review">("define");
  const { startLatLng, endLatLng, startPickingEnd, stopPicking, closeWizard, setGeocodedLatLng, preselectedVolunteerId } = useMissionWizardStore();
  const [missionParams, setMissionParams] = useState<MissionParameters>({
    title: "",
    description: "",
    missionType: MissionType.OTHER,
    region: "",
    priority: MissionPriority.MEDIUM,
    difficulty: MissionDifficulty.ROUTINE,
    requiredSkills: [],
    startLocation: undefined,
  });

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [addressInput, setAddressInput] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocodeAddress = async () => {
    if (!addressInput.trim()) return;
    setIsGeocoding(true);
    const result = await geocodeAddress(addressInput);
    setIsGeocoding(false);
    if (!result) {
      toast.error("Address not found. Try a more specific location.");
      return;
    }
    const region = inferRegion(result.lat, result.lng);
    setAddressLabel(result.displayName);
    setGeocodedLatLng(L.latLng(result.lat, result.lng), result.displayName);
    setMissionParams((prev) => ({
      ...prev,
      startLocation: { lat: result.lat, lng: result.lng },
      region,
    }));
  };

  const {
    assigneeId,
    resourceIds,
    setAssignee,
    reset: resetSelections,
  } = useTaskFormStore();

  const { mutate: createTask, isPending: isCreatingTask } = useCreateTask();
  const { mutate: findMatches, isPending: isFindingMatches } = useTaskSuggestions();

  useEffect(() => {
    if (preselectedVolunteerId) setAssignee(preselectedVolunteerId);
  }, [preselectedVolunteerId, setAssignee]);

  // Resources are only mandatory for resource delivery missions
  const requiresResources = missionParams.missionType === MissionType.RESOURCE_DELIVERY;

  const handleParamChange = (field: keyof MissionParameters, value: any) => {
    setMissionParams((prev) => {
      if (field === "missionType") {
        const defaultSkills = MISSION_TYPE_DEFAULT_SKILLS[value as MissionType];
        return { ...prev, [field]: value, requiredSkills: defaultSkills };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSkillToggle = (skill: string) => {
    setMissionParams((prev) => {
      const newSkills = prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill];
      return { ...prev, requiredSkills: newSkills };
    });
  };

  const handleFindMatches = () => {
    if (!missionParams.title) {
      toast.warning("Please provide a mission title.");
      return;
    }
    if (!missionParams.startLocation && !missionParams.region) {
      toast.warning("Please set a start location or search an address first.");
      return;
    }
    findMatches(missionParams, {
      onSuccess: (data) => {
        setSuggestions(data.volunteers);
        setStep("review");
      },
    });
  };

  const handleCreateTask = () => {
    if (requiresResources && resourceIds.length === 0) {
      toast.warning("Resource delivery missions require at least one resource.");
      return;
    }

    const finalTaskData = {
      ...missionParams,
      assigneeId: assigneeId || undefined,
      resourceIds: resourceIds.length > 0 ? resourceIds : [],
      endLocation: missionParams.endLocation,
      creatorId: currentUser?.id,
    };
    createTask(finalTaskData, {
      onSuccess: (created) => {
        handleReset();
        closeWizard();
        router.push(`/chat/${created.id}`);
      },
    });
  };

  const handleReset = () => {
    setMissionParams({
      title: "",
      description: "",
      missionType: MissionType.OTHER,
      region: "",
      priority: MissionPriority.MEDIUM,
      difficulty: MissionDifficulty.ROUTINE,
      requiredSkills: [],
    });
    setAddressInput("");
    setAddressLabel("");
    resetSelections();
    setSuggestions([]);
    setStep("define");
  };

  useEffect(() => {
    if (startLatLng) {
      const region = inferRegion(startLatLng.lat, startLatLng.lng);
      setMissionParams((prev) => ({
        ...prev,
        startLocation: { lat: startLatLng.lat, lng: startLatLng.lng },
        region: prev.region || region,
      }));
    }
  }, [startLatLng]);

  useEffect(() => {
    if (endLatLng) {
      setMissionParams((prev) => ({
        ...prev,
        endLocation: { lat: endLatLng.lat, lng: endLatLng.lng },
      }));
      stopPicking();
    }
  }, [endLatLng, stopPicking]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Mission Wizard</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
        <CardDescription>
          {step === "define"
            ? "Step 1: Define mission parameters."
            : "Step 2: Review suggestions and assign personnel."}
        </CardDescription>
      </CardHeader>

      {step === "define" && (
        <>
          <CardContent className="space-y-4">
            {/* Mission type selector */}
            <div className="space-y-2">
              <Label>Mission Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(MissionType).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleParamChange("missionType", t)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      missionParams.missionType === t
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{MISSION_TYPE_LABELS[t]}</div>
                    <div className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
                      {MISSION_TYPE_DESCRIPTIONS[t]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Mission Title</Label>
                  <Input
                    id="title"
                    value={missionParams.title}
                    onChange={(e) => handleParamChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mission Description</Label>
                  <Textarea
                    id="description"
                    value={missionParams.description}
                    onChange={(e) => handleParamChange("description", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={missionParams.priority}
                      onValueChange={(v) => handleParamChange("priority", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MissionPriority).map((p) => (
                          <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={missionParams.difficulty}
                      onValueChange={(v) => handleParamChange("difficulty", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MissionDifficulty).map((d) => (
                          <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Mission Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      placeholder="e.g. Kharkiv, Sumska St 10"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGeocodeAddress()}
                      disabled={isGeocoding}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleGeocodeAddress} disabled={isGeocoding}>
                      {isGeocoding ? "..." : "Find"}
                    </Button>
                  </div>
                  {addressLabel && (
                    <p className="text-xs text-muted-foreground truncate">{addressLabel}</p>
                  )}
                  {missionParams.region && (
                    <p className="text-xs text-primary">Region: <span className="capitalize font-medium">{missionParams.region}</span></p>
                  )}
                </div>
              </div>
            </div>

            {/* Location summary */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border px-3 py-2 bg-muted/40">
                <p className="text-xs text-muted-foreground mb-0.5">Start location</p>
                {missionParams.startLocation
                  ? <p className="font-mono font-medium">{missionParams.startLocation.lat.toFixed(4)}, {missionParams.startLocation.lng.toFixed(4)}</p>
                  : <p className="text-muted-foreground italic">Right-click map to set</p>}
              </div>
              <div className="rounded-md border px-3 py-2 bg-muted/40">
                <p className="text-xs text-muted-foreground mb-0.5">Destination</p>
                {missionParams.endLocation
                  ? <p className="font-mono font-medium">{missionParams.endLocation.lat.toFixed(4)}, {missionParams.endLocation.lng.toFixed(4)}</p>
                  : <p className="text-muted-foreground italic">Not set</p>}
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={startPickingEnd} className="w-full">
              Pick Destination on Map
            </Button>

            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="grid grid-cols-3 gap-x-2 gap-y-3">
                {allSkills.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill}
                      checked={missionParams.requiredSkills.includes(skill)}
                      onCheckedChange={() => handleSkillToggle(skill)}
                    />
                    <Label htmlFor={skill} className="text-sm font-normal cursor-pointer">
                      {skill.charAt(0).toUpperCase() + skill.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleFindMatches} disabled={isFindingMatches}>
              {isFindingMatches ? "Finding Matches..." : "Next: Find Best Matches"}
            </Button>
          </CardFooter>
        </>
      )}

      {step === "review" && (
        <>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Reviewing suggestions for:{" "}
              <span className="font-semibold">{missionParams.title}</span>
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {MISSION_TYPE_LABELS[missionParams.missionType]}
              </span>
            </p>

            {preselectedVolunteerId && assigneeId === preselectedVolunteerId && (
              <div className="mb-4 rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Volunteer pre-selected from dispatch. You can change the selection below.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SuggestionList
                  title="1. Select a Volunteer (optional)"
                  suggestions={suggestions}
                  selectedId={assigneeId}
                  onSelect={setAssignee}
                />
                {!assigneeId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    You can assign a volunteer later from the mission details page.
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold mb-2">
                  2. Select Resources{" "}
                  {requiresResources
                    ? <span className="text-red-500">*required</span>
                    : <span className="text-muted-foreground font-normal">(optional)</span>}
                </h4>
                <ResourceSelectionList />
              </div>
            </div>
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-4 pt-6">
            <Button variant="outline" onClick={() => { setStep("define"); resetSelections(); }}>
              Back
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={isCreatingTask || (requiresResources && resourceIds.length === 0)}
            >
              {isCreatingTask ? "Creating..." : "Create Mission"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
