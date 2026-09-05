import JellyButtonDom from '@/src/components/jelly/JellyButton.dom';
import { jellyDom } from '@/src/components/jelly/domProps';

export function CamSwitch({
  label,
  on,
  onPress,
}: {
  label: string;
  on?: boolean;
  onPress: () => void;
}) {
  return (
    <JellyButtonDom
      {...jellyDom()}
      label={label}
      active={on}
      size="sm"
      onPress={async () => onPress()}
    />
  );
}
