export default function ProfilePage() {
  return (
    <section className="py-12">
      <h1 className="mb-2 text-2xl font-semibold">Mój profil</h1>
      <p className="text-sm text-slate-400">
        Dane zalogowanego użytkownika (GET /api/v1/users/me) zostaną pobrane i
        wyświetlone zgodnie z roadmapą.
      </p>
    </section>
  )
}