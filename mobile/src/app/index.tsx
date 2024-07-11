import { useEffect, useState } from "react";
import { View, Text, Image, Keyboard, Alert } from "react-native";
import {
  MapPin,
  CalendarIcon,
  Settings2,
  UserRoundPlus,
  ArrowRight,
  AtSign,
} from "lucide-react-native";
import { colors } from "@/styles/colors";
import dayjs from "dayjs";
import { DateData } from "react-native-calendars";

import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { validateInput } from "@/utils/validateInput";
import { tripStorage } from "@/storage/trip";
import { tripServer } from "@/server/trip-server";

import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import { GuestEmail } from "@/components/email";
import { router } from "expo-router";
import { Loading } from "@/components/loading";

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAILS = 2,
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2,
}

const Index = () => {
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isGettingTrip, setIsGettingTrip] = useState(true);

  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS);
  const [showModal, setShowModal] = useState(MODAL.NONE);
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
  const [destination, setDestination] = useState("");
  const [emailToInvite, setEmailToInvite] = useState("");
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([]);

  function handleNextStepForm() {
    if (
      destination.trim().length === 0 ||
      !selectedDates.startsAt ||
      !selectedDates.endsAt
    ) {
      return Alert.alert("Atenção", "Preencha todos os campos");
    }

    if (destination.length < 4) {
      return Alert.alert(
        "Atenção",
        "O destino deve ter no mínimo 4 caracteres"
      );
    }

    if (stepForm === StepForm.TRIP_DETAILS) {
      return setStepForm(StepForm.ADD_EMAILS);
    }

    Alert.alert("Confirmação", "Deseja confirmar a viagem?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Confirmar",
        onPress: createTrip,
      },
    ]);
  }

  function handleSelectDates(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    });
    setSelectedDates(dates);
  }

  function handleRemoveEmail(emailToRemove: string) {
    setEmailsToInvite((preveState) =>
      preveState.filter((email) => email !== emailToRemove)
    );
  }

  function handleAddEmail() {
    if (!validateInput.email(emailToInvite)) {
      return Alert.alert("Atenção", "E-mail inválido");
    }

    const emailAlreadyExists = emailsToInvite.find(
      (email) => email === emailToInvite
    );

    if (emailAlreadyExists) {
      return Alert.alert("Atenção", "E-mail já adicionado");
    }

    setEmailsToInvite((prevState) => [...prevState, emailToInvite]);
    setEmailToInvite("");
  }

  async function saveTrip(tripId: string) {
    try {
      await tripStorage.save(tripId);
      router.navigate(`/trip/${tripId}`);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar a viagem");
      console.log(error);
    }
  }

  const createTrip = async () => {
    try {
      setIsCreatingTrip(true);

      const newTrip = await tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
        emails_to_invite: emailsToInvite,
      });

      Alert.alert("Sucesso", "Viagem criada com sucesso", [
        {
          text: "OK",
          onPress: () => saveTrip(newTrip.tripId),
        },
      ]);
    } catch (error) {
      setIsCreatingTrip(false);
      console.log(error);
    }
  };

  async function getTrip() {
    try {
      const tripID = await tripStorage.get()

      if (!tripID) {
        return setIsGettingTrip(false)
      }

      const trip = await tripServer.getByID(tripID)

      if (trip) {
        return router.navigate(`/trip/${trip.id}`)
      }
    } catch (error) {
      setIsGettingTrip(false)
      console.log(error)
    }
  }

  useEffect(() => {
    getTrip()
  }, [])

  if (isGettingTrip) {
    return <Loading />
  }

  return (
    <View className="flex-1 items-center justify-center px-5">
      <Image
        source={require("@/assets/logo.png")}
        className="h-8"
        resizeMode="contain"
      />

      <Image source={require("@/assets/bg.png")} className="absolute" />

      <Text className="text-zinc-400 font-regular text-center text-lg mt-3">
        Convide seus amigos e planeje sua{"\n"}próxima viagem
      </Text>
      <View className="w-full bg-zinc-900 rounded-xl my-8 border border-zinc-800 p-4 ">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Para onde?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            onChangeText={setDestination}
            value={destination}
          />
        </Input>
        <Input>
          <CalendarIcon color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Quando?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPressIn={() =>
              stepForm === StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)
            }
            value={selectedDates.formatDatesInText}
          />
        </Input>

        {stepForm === StepForm.ADD_EMAILS && (
          <>
            <View className="border-b py-3 border-zinc-800">
              <Button
                variant="secondary"
                onPress={() => setStepForm(StepForm.TRIP_DETAILS)}
              >
                <Button.Title>Alterar Local/Data</Button.Title>
                <Settings2 color={colors.zinc[200]} size={20} />
              </Button>
            </View>
            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Quem estará na viagem?"
                autoCorrect={false}
                value={
                  emailsToInvite.length > 0
                    ? `${emailsToInvite.length} pessoa(s) convidada(s)`
                    : ""
                }
                onPress={() => {
                  Keyboard.dismiss();
                  setShowModal(MODAL.GUESTS);
                }}
                showSoftInputOnFocus={false}
              />
            </Input>
          </>
        )}

        <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
          <Button.Title>
            {stepForm === StepForm.TRIP_DETAILS
              ? "Continuar"
              : "Confirmar Viagem"}
          </Button.Title>
          <ArrowRight color={colors.lime[950]} size={20} />
        </Button>
      </View>

      <Text className="text-zinc-500 font-regular text-center text-base">
        Ao continuar, você concorda com nossos{" "}
        <Text className="text-zinc-300 underline">
          Termos de Serviço e Política de Privacidade.
        </Text>
      </Text>

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
          <Button onPress={() => setShowModal(MODAL.NONE)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Adicionar convidados"
        subtitle="Adicione os e-mails dos seus amigos"
        visible={showModal === MODAL.GUESTS}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="my-2 flex-col gap-2 border-b border-zinc-700 py-5 items-start">
          {emailsToInvite.length > 0 ? (
            emailsToInvite.map((email) => (
              <GuestEmail
                key={email}
                email={email}
                onRemove={() => handleRemoveEmail(email)}
              />
            ))
          ) : (
            <Text className="text-zinc-600 font-regular text-base">
              Nenhum convidado adicionado
            </Text>
          )}
        </View>
        <View className="gap-4 mt-4 w-full">
          <Input variant="secondary">
            <AtSign color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="E-mail do convidado"
              keyboardType="email-address"
              onChangeText={(text) => setEmailToInvite(text.toLowerCase())}
              value={emailToInvite}
              returnKeyLabel="send"
              onSubmitEditing={handleAddEmail}
            />
          </Input>

          <Button onPress={handleAddEmail}>
            <Button.Title>Convidar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
};

export default Index;
