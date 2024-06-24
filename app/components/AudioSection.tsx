interface AudioSectionProps {
  showSoundClips: boolean;
}

const AudioSection: React.FC<AudioSectionProps> = ({ showSoundClips }) => {
  return (
    <>
      {showSoundClips && (
        <div>
          <span id="hint" className="block text-lg text-gray-300">
            Recent sound clips
          </span>
          <section
            id="sound-clips"
            className="w-full bg-gray-800 mt-1"
            style={{ flex: 1, overflow: "auto" }}
          ></section>
        </div>
      )}
    </>
  );
};

export default AudioSection;
