export default function Home() {
  return (
    <main className="landing">
      <div className="landingCard">
        <div className="eyebrow">SOUTHEAST TENNESSEE SPORTS NETWORK</div>
        <h1>SETN SPORTS LIVE</h1>
        <p>
          Prototype live gamecast: real-time score, clock, possession, down and distance,
          field position and last-play updates.
        </p>
        <div className="landingLinks">
          <a className="watchButton" href="/live/whitwell-south-pittsburg-demo">Open Demo Gamecast</a>
          <a className="secondaryButton" href="/admin/whitwell-south-pittsburg-demo">Open Scorekeeper</a>
        </div>
      </div>
    </main>
  );
}
