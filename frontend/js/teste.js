
let db;

// Abre (ou cria) o banco
const request = indexedDB.open("crudPosts", 1);

// Executado apenas na primeira criação do banco
request.onupgradeneeded = (event) => {

    db = event.target.result;

    db.createObjectStore("posts", {
        keyPath: "id"
    });
};

request.onsuccess = (event) => {

    db = event.target.result;

    listarPosts();
};

request.onerror = (event) => {

    console.error(
        "Erro ao abrir banco:",
        event.target.error
    );
};

const form = document.getElementById("postForm");
const tabela = document.getElementById("tabelaPosts");
const preview = document.getElementById("preview");

let arquivoImagem = null;

// PREVIEW DA IMAGEM

document
    .getElementById("imagem")
    .addEventListener("change", (e) => {

        arquivoImagem = e.target.files[0];

        if (!arquivoImagem) return;

        preview.src =
            URL.createObjectURL(arquivoImagem);

        preview.style.display = "block";
    });

form.addEventListener("submit", (e) => {

    e.preventDefault();

    const idEdicao =
        document.getElementById("id").value;

    const agora = new Date().toISOString();

    if (idEdicao) {

        buscarPost(Number(idEdicao), (postAntigo) => {

            const postAtualizado = {

                ...postAntigo,

                nomeUsuario:
                    document.getElementById("nomeUsuario").value,

                nomeOsc:
                    document.getElementById("nomeOsc").value,

                ativo:
                    document.getElementById("ativo").checked,

                titulo:
                    document.getElementById("titulo").value,

                conteudo:
                    document.getElementById("conteudo").value,

                imagem:
                    arquivoImagem || postAntigo.imagem,

                dataAtualizacao:
                    agora
            };

            salvarPost(postAtualizado);
        });
    }

    else {

        const post = {

            id: Date.now(),

            nomeUsuario:
                document.getElementById("nomeUsuario").value,

            nomeOsc:
                document.getElementById("nomeOsc").value,

            ativo:
                document.getElementById("ativo").checked,

            titulo:
                document.getElementById("titulo").value,

            conteudo:
                document.getElementById("conteudo").value,

            imagem:
                arquivoImagem,

            dataCriacao:
                agora,

            dataAtualizacao:
                agora
        };

        salvarPost(post);
    }
});

function salvarPost(post) {

    const transaction =
        db.transaction(
            ["posts"],
            "readwrite"
        );

    const store =
        transaction.objectStore("posts");

    store.put(post);

    transaction.oncomplete = () => {

        listarPosts();

        limparFormulario();
    };
}

function listarPosts() {

    const transaction =
        db.transaction(
            ["posts"],
            "readonly"
        );

    const store =
        transaction.objectStore("posts");

    const request =
        store.getAll();

    request.onsuccess = () => {

        renderizarTabela(
            request.result
        );
    };
}

function buscarPost(id, callback) {

    const transaction =
        db.transaction(
            ["posts"],
            "readonly"
        );

    const store =
        transaction.objectStore("posts");

    const request =
        store.get(id);

    request.onsuccess = () => {

        callback(
            request.result
        );
    };
}

function excluir(id) {

    if (
        !confirm(
            "Deseja excluir este post?"
        )
    ) {
        return;
    }

    const transaction =
        db.transaction(
            ["posts"],
            "readwrite"
        );

    const store =
        transaction.objectStore("posts");

    store.delete(id);

    transaction.oncomplete = () => {

        listarPosts();
    };
}

function editar(id) {

    buscarPost(id, (post) => {

        document.getElementById("id").value =
            post.id;

        document.getElementById("nomeUsuario").value =
            post.nomeUsuario;

        document.getElementById("nomeOsc").value =
            post.nomeOsc;

        document.getElementById("ativo").checked =
            post.ativo;

        document.getElementById("titulo").value =
            post.titulo;

        document.getElementById("conteudo").value =
            post.conteudo;

        arquivoImagem =
            post.imagem;

        if (post.imagem) {

            preview.src =
                URL.createObjectURL(
                    post.imagem
                );

            preview.style.display =
                "block";
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

function renderizarTabela(posts) {

    let html = "";

    posts.forEach(post => {

        let imagemHtml = "";

        if (post.imagem) {

            const url =
                URL.createObjectURL(
                    post.imagem
                );

            imagemHtml =
                `<img src="${url}" class="thumb">`;
        }

        html += `
            <tr>

                <td>${post.id}</td>

                <td>${imagemHtml}</td>

                <td>${post.titulo}</td>

                <td>${post.nomeUsuario}</td>

                <td>${post.nomeOsc}</td>

                <td>
                    ${post.ativo ? "Sim" : "Não"}
                </td>

                <td>
                    ${new Date(
                        post.dataCriacao
                    ).toLocaleString()}
                </td>

                <td>
                    ${new Date(
                        post.dataAtualizacao
                    ).toLocaleString()}
                </td>

                <td>

                    <button
                        class="btn-editar"
                        onclick="editar(${post.id})"
                    >
                        Editar
                    </button>

                    <button
                        class="btn-excluir"
                        onclick="excluir(${post.id})"
                    >
                        Excluir
                    </button>

                </td>

            </tr>
        `;
    });

    tabela.innerHTML = html;
}

function limparFormulario() {

    form.reset();

    document.getElementById("id").value = "";

    arquivoImagem = null;

    preview.src = "";

    preview.style.display = "none";
}