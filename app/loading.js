import { NavbarSkeleton } from "@/components/Skeletons";
import Loading from "@/components/Loading";

export default function AppLoading() {
  return (
    <div className="w-full min-h-screen">
      <NavbarSkeleton />
      <div className="flex flex-col items-center justify-center h-[60vh]">
         <Loading />
      </div>
    </div>
  );
}
