export default function FeatureLoader({ size }: { size: number }) {
  return (
    <>
      <div className="h-[3px] w-[100%] bg-[var(--colors-black-10)] flex justify-start">
        <span className={`h-[3px] w-[50%] bg-[var(--colors-black-40)`} />
      </div>
    </>
  );
}
