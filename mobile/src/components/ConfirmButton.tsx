import React from 'react';
import { Alert, Button } from 'react-native';

type Props = {
  title: string;
  message: string;
  onConfirm: () => void;
  color?: string;
  disabled?: boolean;
};

export default function ConfirmButton({ title, message, onConfirm, color, disabled }: Props) {
  const handlePress = () => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  };

  return <Button title={title} onPress={handlePress} color={color} disabled={disabled} />;
}
