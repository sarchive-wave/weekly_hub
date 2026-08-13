"""사용자 표시 정렬 공통 규칙: 직책 순 → 이름(가나다) 순."""

POSITION_ORDER = {"센터장": 1, "팀장": 2, "차장": 3, "과장": 4, "대리": 5}


def pos_rank(position) -> int:
    return POSITION_ORDER.get(position or "", 99)


def user_sort_key(user):
    # 직책 순위 → 이름 가나다(한글 유니코드 = 가나다 순), 동률은 id
    return (pos_rank(getattr(user, "position", None)), (user.display_name or ""), user.id)
