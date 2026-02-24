import Image from "next/image";
import Link from "next/link";
import logo from "../../public/screenshot/logodesktop.svg";
import mobileLogo from "../../public/z.webp";
import SearchBox from "./SearchBox";
import UserNav from "./UserNav";
import LanguageSwitcher from "./LanguageSwitcher";

function Navbar() {
  return (
    <nav className="w-full border-b">
      <div className="flex items-center justify-between container mx-auto px-5 lg:px-10 py-5">
        <Link href={"/"}>
          <Image src={logo} alt="logo" className="w-32 hidden lg:block" />
          <Image
            src={mobileLogo}
            alt="Mobile Logo"
            className="block lg:hidden w-12"
          />
        </Link>
        <SearchBox />
        <div className="flex items-center gap-x-4">
          <LanguageSwitcher />
          <UserNav />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
