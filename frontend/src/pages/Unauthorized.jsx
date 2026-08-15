export default function Unauthorized() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600">403 — Not Authorized</h1>
      <p className="text-gray-600 mt-2">You don't have access to this page.</p>
    </div>
  );
}