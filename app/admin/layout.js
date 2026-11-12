import "./admin.css";

export const metadata = {
  title: "Enso admin",
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }) {
  return <div className="admin">{children}</div>;
}
