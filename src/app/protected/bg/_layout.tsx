import { Stack } from "expo-router";
import React from "react";

const ProtectedBGScreenLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
};

export default ProtectedBGScreenLayout;
