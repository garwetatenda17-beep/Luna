export const metadata = {
  title: "LUNA - AI Store Builder For Africa",
  description: "Your Shop Builds Itself While You Sleep",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0A0A0A" }}>{children}</body>
    </html>
  );
}
