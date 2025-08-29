import { Dialog } from "@headlessui/react";
import moment from "moment";
import { useNavigate } from "react-router";
import React, {
  useContext,
  useState,
} from "react";
import type { Dispatch, FC, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

// Mock useSession for now - will replace with actual auth
const useSession = () => ({ data: null });
import { CgCheck } from "react-icons/cg";
import { IoArrowForwardSharp, IoCloseSharp } from "react-icons/io5";
import { RiLoader4Fill } from "react-icons/ri";
import { PreferencesContext } from "~/contexts/preferences-context";
import type {
  MatchEntity,
  ParlayLeg,
} from "~/types/model";

// Define missing types locally
interface BetEntity {
  home?: string;
  away?: string;
  odds?: any;
  returns?: number;
  stake?: number;
  sport?: string;
  startTime?: Date;
  status?: string;
  tournament?: string;
  tournamentName?: string;
  wager?: string;
  reasoning?: string;
  matchIds?: string[];
}

export interface SelectedWagerData {
  type: string;
  wager: string;
  spread?: number;
  odds: number;
  line?: number;
}
import { getCleanTournamentName } from "../../../../../utils/getCleanTournamentName";
import { getFirstAndLastName } from "../../../../../utils/getFirstAndLastName";
import { getTourTypeFromTournamentName } from "../../../../../utils/getTourTypeFromTournamentName";
import { handleMutation } from "../../../../../utils/handleMutation";
import { getFormattedOdds } from "../../../../../utils/model/getFormattedOdds";
import { getLastAndFirstInitial } from "../../../../../utils/model/getLastAndFirstInitial";
import { showToast } from "../../../../../utils/showToast";
import { InputField } from "../../../../shared/InputField";
import { ParlaySection } from "./ParlaySection";
import { Reasoning } from "./Reasoning";
import { WagerSection } from "./WagerSection";

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  selectedWagerData?: SelectedWagerData;
  match?: MatchEntity;
  homeImage?: string;
  awayImage?: string;
  isParlayActive: boolean;
  setIsParlayActive: Dispatch<SetStateAction<boolean>>;
  parlayLegs?: ParlayLeg[];
  setParlayLegs: Dispatch<SetStateAction<ParlayLeg[] | undefined>>;
  resetActiveIds: () => void;
}

const OneClickAddBetModal: FC<Props> = ({
  isModalOpen,
  setIsModalOpen,
  selectedWagerData,
  match,
  homeImage,
  awayImage,
  isParlayActive,
  setIsParlayActive,
  parlayLegs,
  setParlayLegs,
  resetActiveIds,
}) => {
  const [activeField, setActiveField] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reasoning, setReasoning] = useState<string | undefined>(undefined);

  const { data } = useSession();
  const { user } = data || {};

  const { oddsFormat, toggleOdds } = useContext(PreferencesContext);

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors, submitCount },
    reset,
  } = useForm<Partial<BetEntity>>();

  const navigate = useNavigate();

  const isOnboarded = user?.username;

  const { type, wager, spread, odds, line } = selectedWagerData || {};
  let { home, away, date, tournament: tournamentName, matchId } = match || {};

  const homeName = home && getLastAndFirstInitial(home);
  const awayName = away && getLastAndFirstInitial(away);

  const imageSrc =
    wager === "home" ? homeImage : wager === "away" ? awayImage : undefined;

  const validStakeField = Number(watch("stake")) > 0;

  const STAKE_MIN_UNIT_SIZE = 0;
  const STAKE_MAX_UNIT_SIZE = Number(process.env.NEXT_PUBLIC_MAX_BET_UNIT_SIZE);
  // Max calculated based on stake max
  const RETURNS_MIN_UNIT_SIZE = 0;
  const RETURNS_MAX_UNIT_SIZE = selectedWagerData
    ? Number(process.env.NEXT_PUBLIC_MAX_BET_UNIT_SIZE) *
      selectedWagerData?.odds
    : 0;

  const hasError = !!Object.keys(errors)?.length;
  const errorMessage = hasError
    ? (Object.values(errors)[0] as FieldError).message
    : "";

  const wagerStr =
    type === "moneyline"
      ? wager === "home"
        ? home
        : away
      : type === "spreadGames"
      ? wager === "home"
        ? `${homeName && getFirstAndLastName(homeName).first} (${
            Number(spread) > 0 ? `+${spread}` : spread
          })`
        : `${awayName && getFirstAndLastName(awayName).first} (${
            Number(spread) > 0 ? `+${spread}` : spread
          })`
      : type === "spreadSets"
      ? wager === "home"
        ? `${homeName && getFirstAndLastName(homeName).first} (${
            Number(spread) > 0 ? `+${spread}` : spread
          })`
        : `${awayName && getFirstAndLastName(awayName).first} (${
            Number(spread) * -1 > 0
              ? `+${Number(spread) * -1}`
              : Number(spread) * -1
          })`
      : type === "totalGames"
      ? wager === "over"
        ? `Over ${line?.toFixed(1)}`
        : `Under ${line?.toFixed(1)}`
      : "";

  // Navigate to complete onboarding
  const navigateToOnboard = () => {
    const action = "bet";
    navigate(`/activate?action=${action}`);
  };

  // Submit form & Create bet with one click
  const handleCreate = async () => {
    const stake = watch("stake");

    if (
      selectedWagerData &&
      stake &&
      wagerStr &&
      date &&
      homeName &&
      awayName &&
      tournamentName &&
      matchId
    ) {
      setIsLoading(true);

      // Handle create a parlay
      if (isParlayActive && parlayLegs && parlayLegs.length > 1) {
        return await handleCreateParlay(parlayLegs);
      }

      const decimalOdds = selectedWagerData.odds;

      const odds = {
        decimal: decimalOdds,
        american: Number(getFormattedOdds(decimalOdds, "american")),
      };

      // @todo - adjust for all sports
      const sport = "tennis";
      const status = "pending";
      const home = getLastAndFirstInitial(homeName);
      const away = getLastAndFirstInitial(awayName);
      const returns = Number(stake) * decimalOdds;
      const startTime = moment(date).toDate();
      const tournament = getTourTypeFromTournamentName(tournamentName);
      const matchIds = [matchId];

      const { first: moneylineWager } = getFirstAndLastName(wagerStr);

      // Format wager str
      const wager =
        type === "moneyline"
          ? `${moneylineWager} ML`
          : type === "spreadGames"
          ? `${wagerStr.replace("(", "").replace(")", "")} Games`
          : type === "spreadSets"
          ? `${wagerStr.replace("(", "").replace(")", "")} Sets`
          : wagerStr;

      // Remove tour type from tournamentName
      tournamentName = getCleanTournamentName(tournamentName);

      const body: Partial<BetEntity> = {
        home,
        away,
        odds,
        returns,
        stake,
        sport,
        startTime,
        status,
        tournament,
        tournamentName,
        wager,
        reasoning,
        matchIds,
      };

      // Create bet
      const { error } = await handleMutation("/api/bets", body);

      if (error) {
        setIsLoading(false);

        // Show toast
        return showToast({
          status: "error",
          message: "Bet could not be created. Try again later.",
        });
      }

      // Show success toast
      showToast({ status: "success", message: "Bet successfully created!" });

      // Reset all fields except sports type
      reset({ stake: 0, returns: 0 });

      // Close panel
      setIsModalOpen(false);

      setIsLoading(false);
    }
  };

  // Create a parlay logic
  const handleCreateParlay = async (legs: ParlayLeg[]) => {
    const stake = watch("stake");

    let decimalOdds = 1;
    let matchIds: string[] = [];
    let wagersArr: string[] = [];
    let datesArr: Date[] = [];

    // Get data from legs
    for (const { matchId, odds, wager, date } of legs) {
      // Parlay odds: product of all odds
      decimalOdds = decimalOdds * odds;

      // Add matchIds to array
      matchIds.push(matchId);

      // Create parlay headline
      wagersArr.push(wager);

      // Create dates array
      if (date) datesArr.push(date);
    }

    const status = "pending";
    const returns = Number(stake) * decimalOdds;
    const odds = {
      decimal: decimalOdds,
      american: Number(getFormattedOdds(decimalOdds, "american")),
    };
    const wager = wagersArr.join(" / ");

    // Get the earliest date of all matches
    const startTime = new Date(
      Math.min(...datesArr.map((date) => date.getTime()))
    );

    const body: Partial<BetEntity> = {
      sport: "parlay",
      odds,
      wager,
      stake,
      returns,
      startTime,
      status,
      reasoning,
      matchIds,
    };

    // Create bet
    const { error } = await handleMutation("/api/bets", body);

    if (error) {
      setIsLoading(false);

      // Show toast
      return showToast({
        status: "error",
        message: "Parlay could not be created. Try again later.",
      });
    }

    // Show success toast
    showToast({ status: "success", message: "Parlay successfully created!" });

    // Reset all fields except sports type
    reset({ stake: 0, returns: 0 });

    // Reset parlay legs & state
    toggleActiveParlay();
    setParlayLegs(undefined);

    // Close panel
    setIsModalOpen(false);

    setIsLoading(false);
  };

  const handleFocus = (id: string) => setActiveField(id);
  const handleBlur = () => setActiveField(undefined);

  // Reset values & Close modal
  const handleClose = () => {
    reset({ stake: 0, returns: 0 });
    setIsModalOpen(false);
  };

  // Set parlay active & inactive
  const toggleActiveParlay = () => {
    // @todo
    // Clear parlay legs
    // if (isParlayActive) {
    //   setParlayLegs(undefined);
    // }

    setIsParlayActive(!isParlayActive);
  };

  // Show toasts on errors to notify user - moved to handleSubmit callback
  if (submitCount && hasError) {
    showToast({ status: "error", message: errorMessage });
  }

  // Handle stake/returns calculation when activeField changes
  const handleStakeChange = () => {
    const stake = watch("stake");
    if (!stake) {
      setValue("returns", 0);
      return;
    }
    if (stake && selectedWagerData && activeField === "stake") {
      // Remove leading zeros
      const str = watch("stake")?.toString();
      setValue("stake", Number(str));

      // Calculate & update returns
      const returns = stake * selectedWagerData.odds;
      const returnsFormatted = Number(
        (returns > RETURNS_MAX_UNIT_SIZE
          ? RETURNS_MAX_UNIT_SIZE
          : returns
        ).toFixed(2)
      );
      setValue("returns", returnsFormatted);
    }
  };

  const handleReturnsChange = () => {
    const returns = watch("returns");
    if (!returns) {
      setValue("stake", 0);
      return;
    }
    if (returns && selectedWagerData && activeField === "returns") {
      // Remove leading zeros
      const str = watch("returns")?.toString();
      setValue("returns", Number(str));

      // Calculate & update stake
      const stake = returns !== 0 ? returns / selectedWagerData.odds : 0;
      const stakeFormatted = Number(
        (stake > STAKE_MAX_UNIT_SIZE ? STAKE_MAX_UNIT_SIZE : stake).toFixed(2)
      );
      setValue("stake", stakeFormatted);
    }
  };

  // Initialize parlay leg immediately when component loads with data
  if (wagerStr && matchId && odds && (!parlayLegs || !parlayLegs.find(leg => leg.matchId === matchId))) {
    const { first } =
      (type === "moneyline" && getFirstAndLastName(wagerStr)) || {};

    // Format wager str
    const wager =
      type === "moneyline"
        ? `${first} ML`
        : type === "spreadGames"
        ? `${wagerStr.replace("(", "").replace(")", "")} Games`
        : type === "spreadSets"
        ? `${wagerStr.replace("(", "").replace(")", "")} Sets`
        : wagerStr;

    const parlayLeg: ParlayLeg = {
      matchId,
      date: moment(date).toDate(),
      headline: `${homeName} vs ${awayName}`,
      odds,
      imageSrc,
      wager,
    };

    // Remove previous bet from same matchId
    const prevLegs = parlayLegs?.filter((leg) => leg.matchId !== matchId);

    // Update parlay leg
    setParlayLegs(prevLegs ? [...prevLegs, parlayLeg] : [parlayLeg]);
  }

  if (!selectedWagerData || !match) {
    return null;
  }

  const stakeRegister: UseFormRegisterReturn = register("stake", {
    required: "The stake units field is required",
    validate: () =>
      validStakeField ||
      `Please enter a stake size from 0 to ${STAKE_MAX_UNIT_SIZE}`,
  });
  const returnsRegister: UseFormRegisterReturn = register("returns", {
    required: "The stake units field is required",
  });

  const commonProps = { oddsFormat, toggleOdds };
  const wagerSectionProps = {
    match,
    selectedWagerData,
    imageSrc,
    wagerStr,
    parlayLegs,
    setParlayLegs,
    ...commonProps,
  };
  const parlaySectionProps = {
    wagerStr,
    parlayLegs,
    setParlayLegs,
    handleClose,
    resetActiveIds,
    ...commonProps,
  };
  const reasoningProps = { setReasoning, activeField, handleFocus, handleBlur };

  return (
    <Dialog
      as="div"
      className="relative z-50"
      open={isModalOpen}
      onClose={handleClose}
    >
      {/* Overlay */}
      <div className="fixed inset-0 opacity-50 backdrop-blur-3xl bg-neutral-600" />

      {/* Modal */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center">
          <Dialog.Panel className="bg-primary w-11/12 rounded-lg md:w-[26rem] md:max-h-screen">
            {/* Header */}
            <div className="flex flex-row justify-between items-center w-full rounded-t-lg p-5 md:py-5 md:p-6">
              <div className="flex flex-row items-center">
                <button
                  onClick={toggleActiveParlay}
                  className={`text-xl font-[800] ${
                    !isParlayActive
                      ? "text-white font-black"
                      : "text-tertiary font-[800]"
                  }`}
                >
                  One-Click Add
                </button>
                <p className="text-xl text-tertiary font-[800] mx-3">/</p>
                <button
                  onClick={toggleActiveParlay}
                  className={`text-xl ${
                    isParlayActive
                      ? "text-white font-black"
                      : "text-tertiary font-[800]"
                  }`}
                >
                  Parlay
                </button>
              </div>

              <IoCloseSharp
                onClick={handleClose}
                className="text-2xl text-white cursor-pointer"
              />
            </div>

            {/* Content */}
            <div className="w-full h-full px-6 pb-8">
              {/* Fields */}
              <div className="flex flex-col w-full overflow-flow overflow-y-scroll overflow-x-hidden pb-6 py-3">
                {/* Wager or Parlay */}
                {!isParlayActive ? (
                  <WagerSection {...wagerSectionProps} />
                ) : (
                  <ParlaySection {...parlaySectionProps} />
                )}

                {/* Reasoning */}
                <Reasoning {...reasoningProps} />

                {/* Risk/Win Fields */}
                <div className="flex flex-row">
                  {/* Name field */}
                  <InputField
                    id="stake"
                    label="Risk"
                    type="number"
                    min={STAKE_MIN_UNIT_SIZE}
                    max={STAKE_MAX_UNIT_SIZE || 5}
                    activeId={activeField}
                    register={stakeRegister}
                    handleFocus={handleFocus}
                    handleBlur={handleBlur}
                    isValidField={validStakeField}
                    wrapperStyle="pb-2 mr-1.5 w-full"
                  />

                  {/* Name field */}
                  <InputField
                    id="returns"
                    label="Win"
                    type="number"
                    min={RETURNS_MIN_UNIT_SIZE}
                    max={RETURNS_MAX_UNIT_SIZE || 5}
                    activeId={activeField}
                    register={returnsRegister}
                    handleFocus={handleFocus}
                    handleBlur={handleBlur}
                    wrapperStyle="pb-2 ml-1.5 w-full"
                  />
                </div>
              </div>

              {/* Add as bet button */}
              {!isOnboarded ? (
                <button
                  onClick={navigateToOnboard}
                  disabled={isLoading}
                  className="large-button w-full flex flex-row justify-center items-center py-[0.75rem!important]"
                >
                  <span className="hidden md:flex flex-row items-center">
                    Complete Onboarding To Add As Bet
                    <IoArrowForwardSharp className="text-primary text-lg ml-1.5 -mr-3" />
                  </span>

                  <span className="flex md:hidden flex-row items-center">
                    Complete Onboarding
                    <IoArrowForwardSharp className="text-primary text-lg ml-1.5 -mr-3" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit(handleCreate)}
                  disabled={isLoading}
                  className="large-button w-full flex flex-row justify-center items-center py-[0.75rem!important]"
                >
                  {!isLoading
                    ? !isParlayActive
                      ? "Add as a bet"
                      : "Add parlay"
                    : "Adding..."}
                  {isLoading ? (
                    <RiLoader4Fill className="text-primary text-3xl animate-spin ml-1.5 -mr-3" />
                  ) : (
                    <CgCheck className="text-green-400 text-3xl ml-1.5 -mr-3" />
                  )}
                </button>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export { OneClickAddBetModal };
