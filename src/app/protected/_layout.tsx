import { Stack } from "expo-router";
import React from "react";

const ProtectedScreenLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
};

export default ProtectedScreenLayout;
