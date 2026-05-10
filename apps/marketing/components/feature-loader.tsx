export default function FeatureLoader({ size: _size }: { size: number }) {
  return (
    <>
      <div className="flex h-[3px] w-[100%] justify-start bg-(--colors-black-10)">
        <span className={`h-[3px] w-[50%] bg-(--colors-black-40)`} />
      </div>
    </>
  );
}
