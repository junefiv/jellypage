import { Redirect, useLocalSearchParams } from 'expo-router';

export default function MatchAlias() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/take/${id}`} />;
}
