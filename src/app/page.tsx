import Image from "next/image"

const Page = () => {
    return (
        <div className={"w-full h-full"}>
            <Image
                src={"/image2.jpg"}
                alt="OPLA"
                width={2000}
                height={1315}
            />
        </div>
    )
}

export default Page
