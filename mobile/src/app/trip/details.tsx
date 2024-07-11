import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Modal } from "@/components/modal";
import { linksServer } from "@/server/links-server";
import { colors } from "@/styles/colors";
import { validateInput } from "@/utils/validateInput";
import { Link2, PenIcon, Plus } from "lucide-react-native";
import { useState } from "react";
import { View, Text, Alert } from "react-native";

const Details = ({ tripId }: { tripId: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [isCreatingLinkTrip, setIsCreatingLinkTrip] = useState(false);
  const [linkTitle, setlinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

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
    } catch (error) {
      console.log(error);
    } finally {
      setIsCreatingLinkTrip(false);
    }
  }

  return (
    <View className="flex-1 mt-10">
      <Text className="text-zinc-50 text-2xl font-semibold mb-2">
        Links Importantes
      </Text>

      <View className="flex-1">
        <Button variant="secondary" onPress={() => setShowModal(true)}>
          <Plus color={colors.zinc[200]} size={20} />
          <Button.Title>Cadastrar novo link</Button.Title>
        </Button>
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
