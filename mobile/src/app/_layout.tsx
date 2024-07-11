import { Slot } from "expo-router";
import { View } from "react-native";
import "@/utils/dayjsLocaleConfig";

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {Loading} from "@/components/loading"

import "@/styles/global.css";

const Layout = () => {
  const [fontsLoaded] = useFonts ({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <Slot />
    </View>
  );
};

export default Layout;
