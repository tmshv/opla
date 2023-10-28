import { emailPattern } from "./email"

describe("email", () => {
    test("pattern should pass valid emails", () => {
        const emails = [
            "gotoandstop.ru@gmail.com",
            "roman@tmshv.ru",
            "tmshv@vk.com",
            "mrpoma@yandex.ru",
            "mrpoma@mail.ru",

            "test@example.com",
            "test1@example.com",
            "user@domain-with-minus.org",
            "user-with-minus@domain-with-minus.org",
            "user_with_unterscore@example.com",
            "hacker+1@example.com",
            "user@acme.studio",
            "user@acme.dev",
            "user@acme1.com",
        ]
        for (const email of emails) {
            const m = emailPattern.test(email)
            expect(m).toBeTruthy()
        }
    })
})
