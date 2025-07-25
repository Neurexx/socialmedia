import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center">
         <Link href={"/signup"} className="bg-white p-2 text-blue-600">Signup</Link>

    </div>
  );
}
