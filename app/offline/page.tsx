export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">You are offline</h1>
        <p className="text-muted-foreground mt-3">
          Moodday is not available without an internet connection. Please check
          your network and try again.
        </p>
      </div>
    </div>
  );
}
