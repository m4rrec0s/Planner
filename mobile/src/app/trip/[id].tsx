import { View, Text, TouchableOpacity, Keyboard, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { TripDetails, tripServer } from "@/server/trip-server";

import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import {
  CalendarIcon,
  CalendarRange,
  Info,
  MapPin,
  Settings2,
  ShowerHead,
} from "lucide-react-native";

import { Loading } from "@/components/loading";
import { Input } from "@/components/input";
import { Button } from "@/components/button";

import { Activities } from "./activities";
import { Details } from "./details";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import { DateData } from "react-native-calendars";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { set } from "zod";
import { c } from "vite/dist/node/types.d-aGj9QkWt";

export type TripData = TripDetails & { when: string };

enum MODAL {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2,
}

const Trip = () => {
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [tripDetails, setTripDetails] = useState({} as TripData);
  const [options, setOptions] = useState<"activity" | "details">("activity");
  const [showModal, setShowModal] = useState(MODAL.NONE);
  const [destination, setDestination] = useState("");
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);

  const tripId = useLocalSearchParams<{ id: string }>().id;
  const getTripDetails = async () => {
    try {
      setIsLoadingTrip(true);

      if (!tripId) {
        return router.back();
      }

      const trip = await tripServer.getByID(tripId);

      const maxLengthDestination = 14;
      const destination =
        trip.destination.length > maxLengthDestination
          ? `${trip.destination.slice(0, maxLengthDestination)}...`
          : trip.destination;

      const starts_at = dayjs(trip.starts_at).format("DD");
      const ends_at = dayjs(trip.ends_at).format("DD");
      const month = dayjs(trip.starts_at).format("MMM");

      setDestination(trip.destination);

      setTripDetails({
        ...trip,
        when: `${destination} de ${starts_at} a ${ends_at} de ${month}.`,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTrip(false);
    }
  };

  function handleSelectDates(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    });
    setSelectedDates(dates);
  }

  if (isLoadingTrip) {
    <Loading />;
  }

  async function handleUpdateTrip() {
    try {
      if (!tripId) {
        return;
      }

      if (!destination || !selectedDates.startsAt || !selectedDates.endsAt) {
        return Alert.alert("Atenção", "Preencha todos os campos");
      }

      setIsUpdatingTrip(true);

      await tripServer.update({
        id: tripId,
        destination,
        starts_at: dayjs(selectedDates.startsAt.dateString).toISOString(),
        ends_at: dayjs(selectedDates.endsAt.dateString).toISOString(),
      });

      Alert.alert("Sucesso", "Viagem atualizada com sucesso", [{
        text: "OK",
        onPress: () => {
          setShowModal(MODAL.NONE);
          getTripDetails();
        },
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingTrip(false);
    }
  }

  useEffect(() => {
    getTripDetails();
  }, []);

  return (
    <View className="flex-1 px-5 pt-16">
      <Input variant="tertiary">
        <MapPin color={colors.zinc[400]} size={20} />
        <Input.Field value={tripDetails.when} readOnly />

        <TouchableOpacity
          activeOpacity={0.6}
          className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
          onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
        >
          <Settings2 color={colors.zinc[400]} size={20} />
        </TouchableOpacity>
      </Input>

      {options === "activity" ? (
        <Activities tripDetails={tripDetails} />
      ) : (
        <Details tripId={tripDetails.id} />
      )}

      <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
        <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
          <Button
            className="flex-1"
            onPress={() => setOptions("activity")}
            variant={options === "activity" ? "primary" : "secondary"}
          >
            <CalendarRange
              color={
                options === "activity" ? colors.lime[950] : colors.zinc[200]
              }
              size={20}
            />
            <Button.Title>Atividades</Button.Title>
          </Button>

          <Button
            className="flex-1"
            onPress={() => setOptions("details")}
            variant={options === "details" ? "primary" : "secondary"}
          >
            <Info
              color={
                options === "details" ? colors.lime[950] : colors.zinc[200]
              }
              size={20}
            />
            <Button.Title>Detalhes</Button.Title>
          </Button>
        </View>
      </View>

      <Modal
        title="Atualizar Viagem"
        subtitle="Apenas quem criou a viagem pode edita-la."
        visible={showModal === MODAL.UPDATE_TRIP}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-2 my-4">
          <Input variant="secondary">
            <MapPin color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Para onde?"
              onChangeText={setDestination}
              value={destination}
            />
          </Input>
          <Input variant="secondary">
            <CalendarIcon color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Quando?"
              value={selectedDates.formatDatesInText}
              onPressIn={() => setShowModal(MODAL.CALENDAR)}
              onFocus={() => Keyboard.dismiss()}
            />
          </Input>

          <Button onPress={handleUpdateTrip} isLoading={isUpdatingTrip}>
            <Button.Title>Atualizar</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Selecionar datas"
        subtitle="Selecione a data de ida e volta da viagem"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar
            onDayPress={handleSelectDates}
            markedDates={selectedDates.dates}
            minDate={dayjs().toISOString()}
          />
          <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
};

export default Trip;
