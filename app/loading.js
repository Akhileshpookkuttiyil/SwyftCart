import { NavbarSkeleton, HomeProductsSkeleton } from "@/components/Skeletons";

export default function AppLoading() {
  return (
    <div className="w-full min-h-screen">
      <NavbarSkeleton />
      <div className="px-6 md:px-16 lg:px-32 mt-6 space-y-10">
        <div className="w-full h-[400px] bg-gray-200 rounded-xl animate-pulse"></div>
        <HomeProductsSkeleton />
      </div>
    </div>
  );
}
