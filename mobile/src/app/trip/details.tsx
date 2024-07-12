import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { linksServer } from "@/server/links-server";
import { colors } from "@/styles/colors";
import { validateInput } from "@/utils/validateInput";
import { Link2, PenIcon, Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View, Text, Alert, FlatList } from "react-native";
import { TripLink, TripLinkProps } from "@/components/tripLink";
import { participantsServer } from "@/server/participants-server";
import { Participant, ParticipantProps } from "@/components/participant";

const Details = ({ tripId }: { tripId: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [isCreatingLinkTrip, setIsCreatingLinkTrip] = useState(false);
  const [linkTitle, setlinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [links, setLinks] = useState<TripLinkProps[]>([]);
  const [participants, setParticipants] = useState<ParticipantProps[]>([]);

  const resetNewLIinkFields = () => {
    setlinkTitle("");
    setLinkUrl("");
    setShowModal(false);
  };

  async function handleCreateTripLink() {
    try {
      if (!linkTitle.trim()) {
        Alert.alert("Link", "Por favor, insira um título para o link.");
      }

      if (!validateInput.url(linkUrl.trim())) {
        Alert.alert("Link", "Por favor, insira uma URL válida.");
      }

      setIsCreatingLinkTrip(true);

      await linksServer.create({
        tripId,
        title: linkTitle,
        url: linkUrl,
      });

      Alert.alert("Link", "Link cadastrado com sucesso!");
      resetNewLIinkFields();
      await getTripLinks();
    } catch (error) {
      console.log(error);
    } finally {
      setIsCreatingLinkTrip(false);
    }
  }

  async function getTripLinks() {
    try {
      const links = await linksServer.getLinksByTripId(tripId);
      setLinks(links);
    } catch (error) {
      console.log(error);
    }
  }

  async function getTripParticipants() {
    try {
      const participants = await participantsServer.getByTripId(tripId);
      setParticipants(participants);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getTripLinks();
    getTripParticipants();
  }, []);

  return (
    <View className="flex-1 mt-10">
      <Text className="text-zinc-50 text-2xl font-semibold mb-4">
        Links Importantes
      </Text>

      <View className="flex-1">
        {links.length > 0 ? (
          <FlatList
            data={links}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TripLink data={item} />}
            contentContainerClassName="gap-4"
          />
        ) : (
          <Text className="text-zinc-50 text-center mt-10">
            Nenhum link cadastrado.
          </Text>
        )}

        <Button variant="secondary" onPress={() => setShowModal(true)}>
          <Plus color={colors.zinc[200]} size={20} />
          <Button.Title>Cadastrar novo link</Button.Title>
        </Button>
      </View>

      <View className="flex-1 border-t border-zinc-800 mt-6">
        <Text className="text-zinc-50 text-2xl font-semibold mb-4">
          Convidados
        </Text>

        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Participant data={item} />}
          contentContainerClassName="gap-4 pb-32"
        />
      </View>

      <Modal
        title="Cadastrar link"
        subtitle="Todos os convidados podem vizualizar os links importantes."
        visible={showModal}
        onClose={() => setShowModal(false)}
      >
        <View className="gap-2 mb-5 p-5 bg-zinc-800 rounded-lg mt-2">
          <Input>
            <PenIcon size={20} color={colors.zinc[400]} />
            <Input.Field
              placeholder="Título do link"
              onChangeText={setlinkTitle}
            />
          </Input>

          <Input>
            <Link2 size={20} color={colors.zinc[400]} />
            <Input.Field placeholder="URL" onChangeText={setLinkUrl} />
          </Input>
        </View>

        <Button isLoading={isCreatingLinkTrip} onPress={handleCreateTripLink}>
          <Button.Title>Salvar Link</Button.Title>
        </Button>
      </Modal>
    </View>
  );
};

export { Details };
