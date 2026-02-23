"use client";

import SearchBox from "./SearchBox";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavbarContentProps {
  userNav: React.ReactNode;
}

function NavbarContent({ userNav }: NavbarContentProps) {
  return (
    <>
      <SearchBox />
      <div className="flex items-center gap-x-4">
        <LanguageSwitcher />
        {userNav}
      </div>
    </>
  );
}

export default NavbarContent;
