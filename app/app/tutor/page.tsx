import LogoutButton from "../LogoutButton";

export default function TutorHome() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Painel do Tutor</h1>
      <p>Em breve: busca, favoritos, histórico, perfil.</p>
      <div style={{ marginTop: 16 }}>
        <LogoutButton />
      </div>
    </div>
  );
}