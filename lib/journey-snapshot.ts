type SnapshotRow={
  current_step:number;
  completed_at:number|null;
  cta_clicked_at:number|null;
  last_seen:number;
  question_id:string|null;
  option_id:string|null;
};

/** A single SQL read keeps answers and the session revision from the same snapshot. */
export async function readJourneySnapshot(db:D1Database,id:string,contentVersion:string){
  const rows=await db.prepare('SELECT s.current_step,s.completed_at,s.cta_clicked_at,s.last_seen,a.question_id,a.option_id FROM sessions s LEFT JOIN answers a ON a.session_id=s.id WHERE s.id=? AND s.content_version=?').bind(id,contentVersion).all<SnapshotRow>();
  const session=rows.results[0];
  if(!session)return null;
  return {
    step:session.current_step,
    answers:Object.fromEntries(rows.results.flatMap(row=>row.question_id!==null&&row.option_id!==null?[[row.question_id,row.option_id]]:[])),
    completed:!!session.completed_at,
    ctaClicked:!!session.cta_clicked_at,
    revision:session.last_seen,
  };
}
