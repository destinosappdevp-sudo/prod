"use client";

interface NavbarContentProps {
  userNav: React.ReactNode;
}

function NavbarContent({ userNav }: NavbarContentProps) {
  return (
    <>
      <div className="flex items-center gap-x-4">
        {userNav}
      </div>
    </>
  );
}

export default NavbarContent;
